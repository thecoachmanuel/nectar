// ─── Session Manager ────────────────────────────────────────────────────────
// In-memory conversation state for customers ordering via WhatsApp

const sessions = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes inactivity

// How long the bot stays paused after the business replies to a customer manually
const BOT_PAUSE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function createInitialSession(phone) {
  return {
    phone,
    step: "MAIN_MENU",
    cart: [],
    selectedItem: null,
    selectedVariation: null,
    availableVariations: [],
    browseCategories: [],
    browseCategory: null,
    browseItems: [],
    searchResults: [],
    recentOrders: [],
    userId: null,
    customerName: null,
    customerEmail: null,
    customerPhone: null,
    savedAddresses: [],
    deliveryAddress: null,
    latitude: undefined,
    longitude: undefined,
    deliveryCharge: 0,
    isKnownUser: false,
    userIdentified: false,
    lastActivity: Date.now(),
    wishlistItems: [],
    wishlistRawInput: "",
    // Bot mode control: null means bot is fully active
    botPausedUntil: null,
  };
}

function getSession(phone) {
  let session = sessions.get(phone);
  if (!session) {
    session = createInitialSession(phone);
    sessions.set(phone, session);
  } else {
    session.lastActivity = Date.now();
  }
  return session;
}

function updateSession(phone, updates) {
  const session = getSession(phone);
  Object.assign(session, updates, { lastActivity: Date.now() });
  sessions.set(phone, session);
  return session;
}

function resetToMenu(phone) {
  const session = getSession(phone);
  session.step = "MAIN_MENU";
  session.selectedItem = null;
  session.selectedVariation = null;
  session.availableVariations = [];
  session.browseItems = [];
  session.searchResults = [];
  session.recentOrders = [];
  session.wishlistItems = [];
  session.wishlistRawInput = "";
  session.lastActivity = Date.now();
  return session;
}

function clearCart(phone) {
  const session = getSession(phone);
  session.cart = [];
  session.step = "MAIN_MENU";
  session.selectedItem = null;
  session.selectedVariation = null;
  session.availableVariations = [];
  session.recentOrders = [];
  session.wishlistItems = [];
  session.wishlistRawInput = "";
  session.lastActivity = Date.now();
  return session;
}

/**
 * Pause the bot for a customer conversation.
 * Called when the business manually sends a message to a customer.
 * @param {string} phone - The customer phone number
 * @param {number} [durationMs] - How long to pause in ms (default: 2 hours)
 */
function pauseBot(phone, durationMs = BOT_PAUSE_DURATION_MS) {
  const session = getSession(phone);
  session.botPausedUntil = Date.now() + durationMs;
  sessions.set(phone, session);
  console.log(`⏸️  Bot paused for ${phone} for ${Math.round(durationMs / 60000)} minutes (business replied manually).`);
  return session;
}

/**
 * Resume the bot for a customer conversation (manually or via command).
 * @param {string} phone - The customer phone number
 */
function resumeBot(phone) {
  const session = getSession(phone);
  session.botPausedUntil = null;
  session.step = "MAIN_MENU";
  sessions.set(phone, session);
  console.log(`▶️  Bot resumed for ${phone}.`);
  return session;
}

/**
 * Check if the bot is currently paused for this customer.
 * Auto-clears expired pauses.
 * @param {string} phone
 * @returns {boolean}
 */
function isBotPaused(phone) {
  const session = sessions.get(phone);
  if (!session || session.botPausedUntil === null) return false;
  if (Date.now() > session.botPausedUntil) {
    // Pause expired — auto-resume
    session.botPausedUntil = null;
    sessions.set(phone, session);
    console.log(`▶️  Bot auto-resumed for ${phone} (pause window expired).`);
    return false;
  }
  return true;
}

/**
 * Get remaining pause time in minutes for a given customer.
 * @param {string} phone
 * @returns {number} remaining minutes, or 0 if not paused
 */
function getBotPauseRemainingMinutes(phone) {
  const session = sessions.get(phone);
  if (!session || !session.botPausedUntil) return 0;
  const remaining = session.botPausedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
}

// Garbage collect expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TTL_MS) {
      sessions.delete(phone);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  getSession,
  updateSession,
  resetToMenu,
  clearCart,
  pauseBot,
  resumeBot,
  isBotPaused,
  getBotPauseRemainingMinutes,
  BOT_PAUSE_DURATION_MS,
};
