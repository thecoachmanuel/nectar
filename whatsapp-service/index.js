require("dotenv").config();
const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const { MongoClient } = require("mongodb");
const { useMongoDBAuthState } = require("./mongoAuthState");
const { Boom } = require("@hapi/boom");
const express = require("express");
const qrcode = require("qrcode");
const pino = require("pino");

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET || "wa_secret_change_me";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodappi";
const logger = pino({ level: "silent" }); // Keep logs quiet in production

// ─── State ─────────────────────────────────────────────────────────────────
let sock = null;
let qrDataUrl = null;          // base64 QR image served to admin UI
let connectionStatus = "disconnected"; // 'connecting' | 'open' | 'disconnected'

// ─── Message Templates ─────────────────────────────────────────────────────
function buildStatusMessage(orderSerialNo, status, customerName, totalAmount) {
  const name = customerName || "Customer";
  const amount = totalAmount ? `₦${Number(totalAmount).toLocaleString()}` : "";

  const templates = {
    pending: `👋 Hi *${name}!*\n\nWe've received your order *#${orderSerialNo}*${amount ? ` (${amount})` : ""} and it's currently *pending confirmation*.\n\nWe'll notify you as soon as it's accepted! 🙏`,
    accepted: `✅ Great news, *${name}!*\n\nYour order *#${orderSerialNo}* has been *accepted* and we're getting started on it right away! 🎉`,
    preparing: `👨‍🍳 Hey *${name}!*\n\nYour order *#${orderSerialNo}* is now being *prepared*. Sit tight — it'll be ready soon! 🔥`,
    ready: `🎁 *${name}*, your order *#${orderSerialNo}* is *READY!*\n\nOur delivery team is about to pick it up. Almost there! 🚀`,
    out_for_delivery: `🚚 *${name}*, your order *#${orderSerialNo}* is *out for delivery!*\n\nOur rider is on their way to you. Please be available to receive it.\n\n_Remember your delivery PIN to verify receipt!_`,
    delivered: `🎉 *${name}*, your order *#${orderSerialNo}* has been *delivered!*\n\nThank you for ordering with us! We hope you enjoy your meal 😋\n\nDon't forget to leave us a review! ⭐`,
    canceled: `😔 *${name}*, unfortunately your order *#${orderSerialNo}* has been *canceled*.\n\nPlease contact us if you have any questions or to place a new order.\n\nSorry for the inconvenience! 🙏`,
  };

  return (
    templates[status] ||
    `Hi *${name}*, your order *#${orderSerialNo}* status has been updated to: *${status.replace("_", " ")}*.`
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
  connectionStatus = "connecting";
  qrDataUrl = null;

  console.log("🗄️  Connecting to MongoDB for WhatsApp auth state...");
  const mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const collection = mongoClient.db().collection("whatsapp_auth");
  
  const { state, saveCreds } = await useMongoDBAuthState(collection);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`🔌 Connecting to WhatsApp (Baileys v${version.join(".")})...`);

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true, // QR shown in terminal too
    logger,
    browser: ["Nectar Bot", "Chrome", "120.0"],
    getMessage: async () => undefined,
  });

  // Save credentials on every update
  sock.ev.on("creds.update", saveCreds);

  // Handle connection state changes
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // New QR code generated — convert to base64 PNG for admin UI
    if (qr) {
      console.log("📱 QR Code ready — scan with WhatsApp on your phone.");
      console.log("   Or visit: http://localhost:" + PORT + "/qr to scan via the admin panel.");
      qrDataUrl = await qrcode.toDataURL(qr);
      connectionStatus = "qr_pending";
    }

    if (connection === "open") {
      console.log("✅ WhatsApp connected successfully!");
      connectionStatus = "open";
      qrDataUrl = null; // Clear QR once connected
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`⚠️  Connection closed. Reason: ${reason}`);
      connectionStatus = "disconnected";

      // Auto-reconnect unless explicitly logged out
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnecting in 3 seconds...");
        setTimeout(connectToWhatsApp, 3000);
      } else {
        console.log("🔴 Logged out. Delete the auth_info folder and restart to re-scan QR.");
        qrDataUrl = null;
      }
    }
  });
}

// ─── Send Message Function ─────────────────────────────────────────────────
async function sendWhatsAppMessage(phone, message) {
  if (!sock || connectionStatus !== "open") {
    throw new Error(`WhatsApp not connected. Status: ${connectionStatus}`);
  }
  let jid = formatPhone(phone);
  console.log(`📱 Formatting phone: "${phone}" -> "${jid}"`);
  
  try {
    const [result] = await sock.onWhatsApp(jid);
    if (result && result.exists && result.jid) {
      jid = result.jid;
      console.log(`🔍 Verified WhatsApp JID: ${jid}`);
    }
  } catch (checkErr) {
    console.warn(`⚠️  onWhatsApp check skipped:`, checkErr.message);
  }

  await sock.sendMessage(jid, { text: message });
  console.log(`📤 Message successfully sent to ${jid}`);
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

// GET /status — Check connection status
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
      message: connectionStatus === "open" ? "Already connected — no QR needed." : "QR not ready yet. Try again in a moment.",
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

// POST /logout — Disconnect and clear session
app.post("/logout", auth, async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
      connectionStatus = "disconnected";
    }
    res.json({ status: true, message: "Logged out successfully. Restart service to re-pair." });
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
