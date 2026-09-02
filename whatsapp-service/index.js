require("dotenv").config();
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  proto,
  BufferJSON,
} = require("@whiskeysockets/baileys");
const { MongoClient } = require("mongodb");
const { useMongoDBAuthState } = require("./mongoAuthState");
const { Boom } = require("@hapi/boom");
const express = require("express");
const qrcode = require("qrcode");
const pino = require("pino");
const NodeCache = require("node-cache");

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET || "wa_secret_change_me";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodappi";
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
const { handleIncomingMessage } = require("./messageHandler");
const logger = pino({ level: "silent" }); // Keep logs quiet in production

// ─── Retry & Message Cache (Fixes "Waiting for this message") ───────────────
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
const messageStore = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
const botSentMessageIds = new NodeCache({ stdTTL: 600, checkperiod: 60 });

// ─── State ─────────────────────────────────────────────────────────────────
let sock = null;
let qrDataUrl = null;          // base64 QR image served to admin UI
let connectionStatus = "disconnected"; // 'connecting' | 'open' | 'disconnected'
let isConnecting = false;
let reconnectTimer = null;
let mongoDbCollection = null;
let mongoDbInstance = null;
let reconnectAttempts = 0;

// ─── Top-Level Uncaught Exception Safety (Auto-recovers from corrupted auth) ─
process.on("uncaughtException", async (err) => {
  console.error("💥 Uncaught Exception:", err.message);
  
  // If crypto Noise handshake or cipher authentication fails (corrupted MongoDB keys)
  if (
    err.message.includes("unable to authenticate data") ||
    err.message.includes("Unsupported state") ||
    err.message.includes("Bad MAC") ||
    err.message.includes("Decipheriv")
  ) {
    console.warn("🧹 Corrupted auth keys detected in MongoDB. Auto-clearing auth state and generating fresh QR...");
    try {
      const coll = await getAuthCollection();
      await coll.deleteMany({});
    } catch (_) {}

    if (sock) {
      try {
        sock.ev.removeAllListeners();
        sock.end(undefined);
      } catch (_) {}
      sock = null;
    }
    connectionStatus = "disconnected";
    qrDataUrl = null;
    isConnecting = false;

    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      connectToWhatsApp().catch(console.error);
    }, 2000);
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled Rejection:", reason);
});

// ─── Database Initialization ────────────────────────────────────────────────
async function getMongoDb() {
  if (mongoDbInstance) return mongoDbInstance;
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  console.log("🗄️  Connected to MongoDB instance.");
  mongoDbInstance = mongoClient.db();

  // Create TTL index on whatsapp_messages to auto-delete messages after 7 days
  try {
    await mongoDbInstance.collection("whatsapp_messages").createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7 * 24 * 3600, background: true }
    );
  } catch (_) {}

  return mongoDbInstance;
}

async function getAuthCollection() {
  if (mongoDbCollection) return mongoDbCollection;
  const db = await getMongoDb();
  mongoDbCollection = db.collection("whatsapp_auth");
  return mongoDbCollection;
}

// ─── Message Persistence (Fixes "Waiting for this message") ─────────────────
async function saveMessage(keyId, message) {
  if (!keyId || !message) return;
  messageStore.set(keyId, message);
  try {
    const db = await getMongoDb();
    const stringified = JSON.stringify(message, BufferJSON.replacer);
    await db.collection("whatsapp_messages").updateOne(
      { _id: keyId },
      { $set: { message: stringified, createdAt: new Date() } },
      { upsert: true }
    );
  } catch (_) {}
}

async function getStoredMessage(key) {
  if (!key?.id) return proto.Message.fromObject({});
  if (messageStore.has(key.id)) {
    return messageStore.get(key.id);
  }
  try {
    const db = await getMongoDb();
    const doc = await db.collection("whatsapp_messages").findOne({ _id: key.id });
    if (doc && doc.message) {
      const parsed = JSON.parse(doc.message, BufferJSON.reviver);
      messageStore.set(key.id, parsed);
      return parsed;
    }
  } catch (_) {}
  return proto.Message.fromObject({});
}

// ─── Chat Message & Conversation Persistence ──────────────────────────────
async function recordChatMessage(phone, sender, text, messageId, db, isBotPausedStatus) {
  if (!phone || !text) return;
  try {
    const mongo = db || (await getMongoDb());
    const timestamp = new Date();
    const cleanPhone = String(phone).replace(/\D/g, "");

    const msgContent = typeof text === "object" ? (text.address || "📍 Location Pin") : String(text);

    // 1. Insert message document
    await mongo.collection("whatsapp_chat_messages").insertOne({
      phone: cleanPhone,
      sender, // "customer" | "business" | "bot"
      text: msgContent,
      messageId: messageId || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      createdAt: timestamp,
    });

    // 2. Lookup customer name if available
    let customerName = "Customer";
    if (cleanPhone.length >= 7) {
      const user = await mongo.collection("users").findOne({
        phone: { $regex: cleanPhone.slice(-9), $options: "i" },
      });
      if (user?.name) customerName = user.name;
    }

    // 3. Upsert conversation document
    await mongo.collection("whatsapp_conversations").updateOne(
      { phone: cleanPhone },
      {
        $set: {
          phone: cleanPhone,
          customerName,
          lastMessage: msgContent.slice(0, 200),
          lastMessageTimestamp: timestamp,
          lastSender: sender,
          isBotPaused: !!isBotPausedStatus,
          updatedAt: timestamp,
        },
        $setOnInsert: {
          createdAt: timestamp,
          unreadCount: 0,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("⚠️ Failed to record chat message:", err.message);
  }
}

// ─── Message Templates ─────────────────────────────────────────────────────
function buildStatusMessage(orderSerialNo, status, customerName, totalAmount) {
  const name = customerName || "Customer";
  const amount = totalAmount ? ` (₦${Number(totalAmount).toLocaleString()})` : "";

  const templates = {
    pending: `🌿 *Nectar Groceries*\n\n👋 Hi *${name}*!\n\nWe've received your grocery order *#${orderSerialNo}*${amount} and it is currently *pending confirmation*.\n\nOur team is reviewing your items, and we'll update you the moment it is confirmed! 🛒✨\n\n_Thank you for choosing Nectar!_`,

    accepted: `🌿 *Nectar Groceries*\n\n✅ Great news, *${name}*!\n\nYour grocery order *#${orderSerialNo}* has been *confirmed*! 🎉\n\nOur store team is now getting your fresh items ready for packing. 🥦🍎\n\n_— Team Nectar_`,

    preparing: `🌿 *Nectar Groceries*\n\n🛍️ Hey *${name}*!\n\nYour order *#${orderSerialNo}* is now being carefully *picked & packed*. 🥑📦\n\nWe ensure only the freshest groceries are selected for your package. Sit tight — it'll be ready shortly! ✨`,

    ready: `🌿 *Nectar Groceries*\n\n🎁 *${name}*, your grocery package *#${orderSerialNo}* is *all packed and ready!* 🛍️\n\nOur dispatch team is assigned and about to pick it up for delivery. 🚀`,

    out_for_delivery: `🌿 *Nectar Groceries*\n\n🚚 Exciting news, *${name}*!\n\nYour grocery order *#${orderSerialNo}* is now *out for delivery!* 🛵💨\n\nOur rider is heading your way with your fresh package. Please be available to receive it.\n\n_— Team Nectar_`,

    delivered: `🌿 *Nectar Groceries*\n\n🎉 *${name}*, your grocery order *#${orderSerialNo}* has been *successfully delivered!* 🏠📦\n\nThank you for shopping with Nectar! We hope you love your fresh groceries. 🍎🥑🥛\n\n_Enjoy your fresh items & see you on your next order!_ ⭐`,

    canceled: `🌿 *Nectar Groceries*\n\n😔 *${name}*, your grocery order *#${orderSerialNo}* has been *canceled*.\n\nIf you have any questions or need assistance, simply reply directly to this chat or reach out to our customer care.\n\n_We apologize for any inconvenience! 🙏_`,
  };

  return (
    templates[status] ||
    `🌿 *Nectar Groceries*\n\nHi *${name}*, your order *#${orderSerialNo}* status has been updated to: *${status.replace("_", " ")}*.\n\n_— Team Nectar_`
  );
}

// ─── Format phone for WhatsApp ─────────────────────────────────────────────
function formatPhone(phoneOrJid) {
  let str = String(phoneOrJid || "").trim();
  // Strip any multi-device suffix e.g. 2348012345678:4@s.whatsapp.net -> 2348012345678@s.whatsapp.net
  str = str.replace(/:.+@/, "@");

  if (str.endsWith("@s.whatsapp.net") || str.endsWith("@lid")) {
    return str;
  }
  let digits = str.replace(/\D/g, "");
  if (digits.startsWith("2340")) {
    digits = "234" + digits.slice(4);
  } else if (digits.startsWith("0")) {
    digits = "234" + digits.slice(1);
  } else if (digits.length === 10 && (digits.startsWith("7") || digits.startsWith("8") || digits.startsWith("9"))) {
    digits = "234" + digits;
  }
  return `${digits}@s.whatsapp.net`;
}

// ─── Extract Message Content Helper ─────────────────────────────────────────
function extractMessageContent(msg) {
  if (!msg) return "";
  let m = msg.message || msg;

  // Unpack nested message wrappers
  while (m) {
    if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
    else if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
    else if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
    else if (m.documentWithCaptionMessage?.message) m = m.documentWithCaptionMessage.message;
    else if (m.editedMessage?.message?.protocolMessage?.editedMessage) m = m.editedMessage.message.protocolMessage.editedMessage;
    else if (m.deviceSentMessage?.message) m = m.deviceSentMessage.message;
    else break;
  }

  if (!m) return "";

  // Check for GPS Location Message
  if (m.locationMessage || m.liveLocationMessage) {
    const loc = m.locationMessage || m.liveLocationMessage;
    return {
      type: "location",
      latitude: loc.degreesLatitude,
      longitude: loc.degreesLongitude,
      address: loc.address || loc.name || `GPS Location (${loc.degreesLatitude?.toFixed(4)}, ${loc.degreesLongitude?.toFixed(4)})`,
    };
  }

  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.listResponseMessage?.title ||
    m.templateButtonReplyMessage?.selectedId ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    m.interactiveResponseMessage?.body?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    ""
  );
}

// ─── WhatsApp Connection ───────────────────────────────────────────────────
async function connectToWhatsApp() {
  if (isConnecting) {
    console.log("⏳ Connection attempt already in progress, skipping duplicate call...");
    return;
  }
  isConnecting = true;
  connectionStatus = "connecting";

  // Clean up any stale socket listeners before reconnecting
  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end(undefined);
    } catch (e) {}
    sock = null;
  }

  try {
    const collection = await getAuthCollection();
    const { state, saveCreds } = await useMongoDBAuthState(collection);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`🔌 Connecting to WhatsApp (Baileys v${version.join(".")})...`);

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      msgRetryCounterCache,
      browser: Browsers.macOS("Chrome"), // Standard desktop browser signature
      printQRInTerminal: false,
      logger,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      generateHighQualityLinkPreview: false,
      getMessage: getStoredMessage,
    });

    // Save credentials on every update
    sock.ev.on("creds.update", saveCreds);

    // Store messages in memory for retry resolution and process customer ordering
    sock.ev.on("messages.upsert", async (m) => {
      const messages = m.messages || [];

      for (const msg of messages) {
        // Cache and persist for Signal retry resolution
        if (msg.key?.id && msg.message) {
          await saveMessage(msg.key.id, msg.message);
        }

        const rawJid = msg.key?.remoteJid || "";
        if (
          !rawJid ||
          rawJid.includes("status@broadcast") ||
          rawJid.endsWith("@g.us") ||
          rawJid.endsWith("@newsletter") ||
          rawJid.endsWith("@lid") // LIDs are internal WhatsApp device IDs, NOT real phone numbers
        ) {
          continue;
        }

        const cleanJid = rawJid.replace(/:.+@/, "@");
        const myJid = (sock.user?.id || "").replace(/:.+@/, "@");
        const myPhone = (sock.user?.id || "").replace(/\D/g, "");
        const senderDigits = cleanJid.replace(/\D/g, "");
        const isSelfChat = Boolean(
          myPhone &&
          senderDigits &&
          (cleanJid === myJid || senderDigits.endsWith(myPhone.slice(-10)) || myPhone.endsWith(senderDigits.slice(-10)))
        );

        // Extract message text or location object
        const messageContent = extractMessageContent(msg);
        if (!messageContent) {
          continue;
        }

        // ── Detect OUTGOING business messages to customers ──────────────────
        // When the business owner manually types and sends a reply to a customer
        // from their phone, we auto-pause the bot for that customer so the
        // business can have a natural conversation without bot interruptions.
        if (msg.key?.fromMe && !isSelfChat) {
          // If this message was sent programmatically by our bot, ignore it
          if (msg.key?.id && botSentMessageIds.has(msg.key.id)) {
            continue;
          }

          const customerPhone = cleanJid.replace(/@.+$/, "");
          // Skip if the derived phone looks like a WhatsApp LID, not a real phone
          const cPhoneDigits = customerPhone.replace(/\D/g, "").length;
          if (cPhoneDigits > 13 && !customerPhone.startsWith("2340")) {
            continue;
          }
          const msgText = String(
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ""
          ).trim();

          // Only pause if manual human message with text
          if (msgText.length > 0) {
            const { pauseBot } = require("./sessionManager");
            pauseBot(customerPhone);
            console.log(`🧑‍💼 Business manually replied to ${customerPhone} from phone — bot paused for 2 hours.`);
            
            // Record manual outgoing business message to chat history
            recordChatMessage(customerPhone, "business", msgText, msg.key?.id, null, true).catch(() => {});
          }
          continue; // Never route outgoing (fromMe) messages through the bot handler
        }

        // Extract real E.164 phone from the JID (e.g. "2348100918189@s.whatsapp.net" -> "2348100918189")
        // Guard against any LID-like digits that slipped through (>13 digits, not a valid 2340... Nigerian format)
        let senderPhone = cleanJid.replace(/@.+$/, "");
        const senderDigitCount = senderPhone.replace(/\D/g, "").length;
        if (senderDigitCount > 13 && !senderPhone.startsWith("2340")) {
          console.warn(`⚠️ Skipping message from suspected LID / non-phone JID: ${rawJid}`);
          continue;
        }
        console.log(`💬 [INCOMING] From: ${cleanJid} (${senderPhone}) | Content: "${typeof messageContent === "string" ? messageContent.slice(0, 50) : "Location Pin"}" | fromMe: ${Boolean(msg.key?.fromMe)}`);

        // Record incoming customer message to chat history
        const { isBotPaused } = require("./sessionManager");
        const currentlyPaused = isBotPaused(senderPhone);
        recordChatMessage(senderPhone, "customer", messageContent, msg.key?.id, null, currentlyPaused).catch(() => {});

        // Send read receipt
        try {
          await sock.readMessages([msg.key]);
        } catch (_) {}

        try {
          const db = await getMongoDb();
          await handleIncomingMessage(
            db,
            APP_URL,
            senderPhone,
            messageContent,
            async (destOrText, maybeText) => {
              let target = rawJid;
              let textToSend = destOrText;

              if (maybeText !== undefined) {
                textToSend = maybeText;
                if (destOrText && destOrText !== senderPhone && destOrText !== rawJid) {
                  target = formatPhone(destOrText);
                }
              }

              console.log(`🤖 [BOT REPLY] Dispatching to ${target}`);
              await sendWhatsAppMessage(target, textToSend);
            }
          );
        } catch (handlerErr) {
          console.error("❌ Error handling incoming message:", handlerErr);
        }
      }
    });

    // Handle connection state changes
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // New QR code generated — convert to base64 PNG for admin UI
      if (qr) {
        console.log("📱 QR Code ready — scan with WhatsApp on your phone.");
        qrDataUrl = await qrcode.toDataURL(qr);
        connectionStatus = "qr_pending";
        isConnecting = false;
      }

      if (connection === "open") {
        console.log("✅ WhatsApp connected successfully!");
        connectionStatus = "open";
        qrDataUrl = null; // Clear QR once connected
        isConnecting = false;
        reconnectAttempts = 0;
      }

      if (connection === "close") {
        isConnecting = false;
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const errorMsg = String(lastDisconnect?.error?.message || lastDisconnect?.error || "");
        console.log(`⚠️  Connection closed. Status code: ${statusCode}. Error: ${errorMsg}`);
        connectionStatus = "disconnected";

        clearTimeout(reconnectTimer);

        // If decryption/authentication failure or explicit logout, clear auth so fresh QR is generated
        if (
          statusCode === DisconnectReason.loggedOut ||
          errorMsg.includes("unable to authenticate data") ||
          errorMsg.includes("Unsupported state") ||
          errorMsg.includes("Bad MAC")
        ) {
          console.log("🔴 Logged out or auth state expired. Clearing MongoDB auth and regenerating QR code...");
          qrDataUrl = null;
          try {
            const coll = await getAuthCollection();
            await coll.deleteMany({});
          } catch (e) {}
          reconnectTimer = setTimeout(connectToWhatsApp, 2000);
        } else if (statusCode === DisconnectReason.restartRequired) {
          console.log("🔄 Immediate restart required by WhatsApp server...");
          reconnectTimer = setTimeout(connectToWhatsApp, 1000);
        } else {
          reconnectAttempts = Math.min(reconnectAttempts + 1, 6);
          const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts - 1), 30000);
          console.log(`🔄 Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts})...`);
          reconnectTimer = setTimeout(connectToWhatsApp, delay);
        }
      }
    });
  } catch (err) {
    isConnecting = false;
    connectionStatus = "disconnected";
    console.error("❌ Connection setup error:", err.message);

    // If initial connection setup failed due to corrupted auth keys, auto-clear
    if (
      err.message.includes("unable to authenticate data") ||
      err.message.includes("Unsupported state") ||
      err.message.includes("Bad MAC") ||
      err.message.includes("Decipheriv")
    ) {
      console.warn("🧹 Wiping corrupted auth in MongoDB...");
      try {
        const coll = await getAuthCollection();
        await coll.deleteMany({});
      } catch (_) {}
    }

    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectToWhatsApp, 5000);
  }
}

// ─── Send Message Function ─────────────────────────────────────────────────
async function sendWhatsAppMessage(phoneOrJid, message) {
  if (!sock || connectionStatus !== "open") {
    throw new Error(`WhatsApp not connected. Status: ${connectionStatus}`);
  }
  let targetJid = formatPhone(phoneOrJid);

  // Sanitize message content
  let textToSend = "";
  if (typeof message === "object" && message !== null) {
    textToSend = message.text || message.message || message.caption || JSON.stringify(message);
  } else {
    textToSend = String(message || "").trim();
  }

  if (!textToSend) {
    console.warn(`⚠️ Warning: Empty message string passed for ${targetJid}`);
    return null;
  }

  console.log(`📱 Sending WhatsApp message to: "${phoneOrJid}" -> "${targetJid}" (${textToSend.length} chars)`);

  // Presence typing indicator (safe catch)
  try {
    sock.presenceSubscribe(targetJid).catch(() => {});
    sock.sendPresenceUpdate("composing", targetJid).catch(() => {});
  } catch (_) {}

  let sentMsg = null;
  try {
    // 200ms buffer for Signal session
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Send text message directly to targetJid
    sentMsg = await sock.sendMessage(targetJid, { text: textToSend });

    // Save message to cache and MongoDB for retry decryption
    if (sentMsg?.key?.id && sentMsg?.message) {
      await saveMessage(sentMsg.key.id, sentMsg.message);
      botSentMessageIds.set(sentMsg.key.id, true);
    }
  } finally {
    // ALWAYS reset typing indicator
    try {
      sock.sendPresenceUpdate("paused", targetJid).catch(() => {});
    } catch (_) {}
  }

  // Record outgoing message in chat history
  const destPhone = targetJid.replace(/@.+$/, "");
  const { isBotPaused } = require("./sessionManager");
  const paused = isBotPaused(destPhone);
  recordChatMessage(destPhone, paused ? "business" : "bot", textToSend, sentMsg?.key?.id, null, paused).catch(() => {});

  console.log(`📤 Message successfully delivered to ${targetJid} (ID: ${sentMsg?.key?.id})`);
  return sentMsg;
}

// ─── Express HTTP Server ───────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Simple API key middleware
function auth(req, res, next) {
  const secret = req.headers["x-api-secret"];
  if (secret !== API_SECRET) {
    return res.status(401).json({ status: false, message: "Unauthorized" });
  }
  next();
}

// GET /order/:id — Redirect to Next.js frontend order tracking page (graceful redirect)
app.get("/order/:id", async (req, res) => {
  try {
    const db = await getMongoDb();
    const { getFrontendAppUrl } = require("./paymentService");
    const frontendUrl = await getFrontendAppUrl(db);
    const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return res.redirect(302, `${frontendUrl}/order/${req.params.id}${queryString}`);
  } catch (err) {
    res.status(500).send("Unable to redirect to order page.");
  }
});

// GET /status — Check connection status (Read-only)
app.get("/status", (req, res) => {
  res.json({
    status: true,
    connection: connectionStatus,
    connected: connectionStatus === "open",
    qrReady: !!qrDataUrl,
  });
});

// GET /qr — Get QR code as base64 image (for admin panel)
app.get("/qr", (req, res) => {
  if (!qrDataUrl) {
    return res.status(404).json({
      status: false,
      message: connectionStatus === "open" ? "Already connected — no QR needed." : "QR code generating... Please refresh in a moment.",
      connection: connectionStatus,
    });
  }
  res.json({ status: true, qr: qrDataUrl });
});

// POST /send — Send a WhatsApp message (called by Next.js API)
// Body: { phone, message } OR { phone, orderSerialNo, orderStatus, customerName, totalAmount }
app.post("/send", auth, async (req, res) => {
  try {
    const { phone, message, orderSerialNo, orderStatus, customerName, totalAmount } = req.body;

    if (!phone) {
      return res.status(400).json({ status: false, message: "phone is required" });
    }

    // Build message from template if individual fields given, else use raw message
    const text =
      message ||
      buildStatusMessage(orderSerialNo, orderStatus, customerName, totalAmount);

    await sendWhatsAppMessage(phone, text);

    res.json({ status: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("❌ Failed to send message:", err.message);
    res.status(500).json({ status: false, message: err.message });
  }
});

// POST /logout — Disconnect, wipe session, and immediately generate a fresh QR code
app.post("/logout", auth, async (req, res) => {
  try {
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {}
      sock = null;
    }

    // Wipe MongoDB auth collection
    try {
      const coll = await getAuthCollection();
      await coll.deleteMany({});
      console.log("🧹 Auth collection cleared in MongoDB on logout");
    } catch (dbErr) {
      console.error("Failed to wipe auth on logout:", dbErr.message);
    }

    connectionStatus = "disconnected";
    qrDataUrl = null;
    isConnecting = false;

    // Immediately trigger a fresh connection to generate new QR
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      connectToWhatsApp().catch(console.error);
    }, 1500);

    res.json({ status: true, message: "Logged out. Fresh QR code is being generated..." });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// POST /bot-mode — Manually pause or resume the bot for a specific customer
// Body: { phone, action: "pause" | "resume", durationMinutes? }
app.post("/bot-mode", auth, (req, res) => {
  try {
    const { phone, action, durationMinutes } = req.body;

    if (!phone || !action) {
      return res.status(400).json({ status: false, message: "phone and action are required" });
    }

    const { pauseBot, resumeBot, isBotPaused, getBotPauseRemainingMinutes } = require("./sessionManager");

    const cleanPhone = String(phone).replace(/\D/g, "");

    if (action === "pause") {
      const durationMs = durationMinutes
        ? Number(durationMinutes) * 60 * 1000
        : 2 * 60 * 60 * 1000; // default 2 hours
      pauseBot(cleanPhone, durationMs);
      return res.json({
        status: true,
        message: `Bot paused for ${cleanPhone} for ${durationMinutes || 120} minutes.`,
        paused: true,
      });
    }

    if (action === "resume") {
      resumeBot(cleanPhone);
      return res.json({
        status: true,
        message: `Bot resumed for ${cleanPhone}.`,
        paused: false,
      });
    }

    if (action === "status") {
      const paused = isBotPaused(cleanPhone);
      const remaining = getBotPauseRemainingMinutes(cleanPhone);
      return res.json({
        status: true,
        phone: cleanPhone,
        botPaused: paused,
        pauseRemainingMinutes: remaining,
      });
    }

    return res.status(400).json({ status: false, message: 'action must be "pause", "resume", or "status"' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// GET / — Health check
app.get("/", (req, res) => {
  res.json({
    service: "Nectar WhatsApp Bot",
    version: "1.0.0",
    connection: connectionStatus,
    endpoints: ["/status", "/qr", "/send (POST)", "/logout (POST)", "/bot-mode (POST)"],
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 WhatsApp Service running on http://localhost:${PORT}`);
  console.log(`🔑 API Secret: ${API_SECRET}`);
  console.log(`📋 Endpoints:`);
  console.log(`   GET  /status  → connection status`);
  console.log(`   GET  /qr      → QR code (base64) for admin panel`);
  console.log(`   POST /send    → send a WhatsApp message`);
  console.log(`   POST /logout  → disconnect WhatsApp session\n`);
});

// ─── Self-Keepalive Ping (Prevents Render Free-Tier Sleep) ──────────────────
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || "https://nectar-58qj.onrender.com/status";
const PING_INTERVAL_MS = 8 * 60 * 1000; // Ping every 8 minutes (Render sleep timeout is 15 mins)

function startKeepAlive() {
  if (!KEEP_ALIVE_URL || KEEP_ALIVE_URL.includes("localhost")) return;
  console.log(`⏱️ Auto-Keepalive initialized: pinging ${KEEP_ALIVE_URL} every 8 mins`);
  
  // Initial ping after 30 seconds
  setTimeout(pingServer, 30 * 1000);

  // Recurring ping every 8 minutes
  setInterval(pingServer, PING_INTERVAL_MS);
}

async function pingServer() {
  try {
    const res = await fetch(KEEP_ALIVE_URL);
    if (res.ok) {
      console.log(`💓 [Keepalive] Render instance kept awake at ${new Date().toLocaleTimeString()}`);
    } else {
      console.warn(`⚠️ [Keepalive] Ping returned status ${res.status}`);
    }
  } catch (err) {
    console.warn(`⚠️ [Keepalive] Ping error:`, err.message);
  }
}

startKeepAlive();

// Start WhatsApp connection
connectToWhatsApp().catch(console.error);
