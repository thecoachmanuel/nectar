require("dotenv").config();
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  proto,
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
const logger = pino({ level: "silent" }); // Keep logs quiet in production

// ─── Retry & Message Cache (Fixes "Waiting for this message") ───────────────
const msgRetryCounterCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
const messageStore = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// ─── State ─────────────────────────────────────────────────────────────────
let sock = null;
let qrDataUrl = null;          // base64 QR image served to admin UI
let connectionStatus = "disconnected"; // 'connecting' | 'open' | 'disconnected'
let isConnecting = false;
let reconnectTimer = null;
let mongoDbCollection = null;

// ─── Database Initialization ────────────────────────────────────────────────
async function getAuthCollection() {
  if (mongoDbCollection) return mongoDbCollection;
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  console.log("🗄️  Connected to MongoDB for WhatsApp auth state.");
  mongoDbCollection = mongoClient.db().collection("whatsapp_auth");
  return mongoDbCollection;
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
function formatPhone(phone) {
  // Remove all non-digit characters
  let digits = String(phone).replace(/\D/g, "");
  
  // If starts with 2340 (e.g. +234 080...), strip the extra 0 after 234
  if (digits.startsWith("2340")) {
    digits = "234" + digits.slice(4);
  }
  // If starts with 0 (Nigerian local, e.g. 080...), convert to international 234
  else if (digits.startsWith("0")) {
    digits = "234" + digits.slice(1);
  }
  // If it's a 10-digit number (e.g. 8012345678, 70..., 90...), prepend 234
  else if (digits.length === 10 && (digits.startsWith("7") || digits.startsWith("8") || digits.startsWith("9"))) {
    digits = "234" + digits;
  }

  // Append WhatsApp suffix
  return `${digits}@s.whatsapp.net`;
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
      keepAliveIntervalMs: 30000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      generateHighQualityLinkPreview: false,
      getMessage: async (key) => {
        if (key?.id && messageStore.has(key.id)) {
          return messageStore.get(key.id);
        }
        return proto.Message.fromObject({});
      },
    });

    // Save credentials on every update
    sock.ev.on("creds.update", saveCreds);

    // Store messages in memory for retry resolution
    sock.ev.on("messages.upsert", async (m) => {
      for (const msg of m.messages) {
        if (msg.key?.id && msg.message) {
          messageStore.set(msg.key.id, msg.message);
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
      }

      if (connection === "close") {
        isConnecting = false;
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        console.log(`⚠️  Connection closed. Status code: ${statusCode}`);
        connectionStatus = "disconnected";

        clearTimeout(reconnectTimer);

        if (statusCode === DisconnectReason.restartRequired) {
          console.log("🔄 Immediate restart required by WhatsApp server...");
          reconnectTimer = setTimeout(connectToWhatsApp, 1000);
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log("🔴 Logged out explicitly. Clearing MongoDB auth and regenerating QR code...");
          qrDataUrl = null;
          try {
            const coll = await getAuthCollection();
            await coll.deleteMany({});
          } catch (e) {}
          reconnectTimer = setTimeout(connectToWhatsApp, 2000);
        } else {
          console.log("🔄 Reconnecting in 3 seconds...");
          reconnectTimer = setTimeout(connectToWhatsApp, 3000);
        }
      }
    });
  } catch (err) {
    isConnecting = false;
    connectionStatus = "disconnected";
    console.error("❌ Connection setup error:", err.message);
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectToWhatsApp, 5000);
  }
}

// ─── Send Message Function ─────────────────────────────────────────────────
async function sendWhatsAppMessage(phone, message) {
  if (!sock || connectionStatus !== "open") {
    throw new Error(`WhatsApp not connected. Status: ${connectionStatus}`);
  }
  const jid = formatPhone(phone);
  console.log(`📱 Sending message to formatted phone: "${phone}" -> "${jid}"`);

  // Optional presence / typing indicator
  sock.sendPresenceUpdate("composing", jid).catch(() => {});

  // Send message directly
  const sentMsg = await sock.sendMessage(jid, { text: message });
  if (sentMsg?.key?.id && sentMsg?.message) {
    messageStore.set(sentMsg.key.id, sentMsg.message);
  }
  console.log(`📤 Message successfully delivered to ${jid} (ID: ${sentMsg?.key?.id})`);

  // Reset presence to paused
  sock.sendPresenceUpdate("paused", jid).catch(() => {});
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

// GET / — Health check
app.get("/", (req, res) => {
  res.json({
    service: "Nectar WhatsApp Bot",
    version: "1.0.0",
    connection: connectionStatus,
    endpoints: ["/status", "/qr", "/send (POST)", "/logout (POST)"],
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

// Start WhatsApp connection
connectToWhatsApp().catch(console.error);
