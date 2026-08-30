// ─── Session Manager ────────────────────────────────────────────────────────
// In-memory conversation state for customers ordering via WhatsApp

const sessions = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function createInitialSession(phone) {
  return {
    phone,
    step: "MAIN_MENU",
    cart: [],
    selectedItem: null,
    browseCategories: [],
    browseCategory: null,
    browseItems: [],
    searchResults: [],
    userId: null,
    customerName: null,
    customerEmail: null,
    savedAddresses: [],
    deliveryAddress: null,
    isKnownUser: false,
    userIdentified: false,
    lastActivity: Date.now(),
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
  session.browseItems = [];
  session.searchResults = [];
  session.lastActivity = Date.now();
  return session;
}

function clearCart(phone) {
  const session = getSession(phone);
  session.cart = [];
  session.step = "MAIN_MENU";
  session.selectedItem = null;
  session.lastActivity = Date.now();
  return session;
}

function deleteSession(phone) {
  sessions.delete(phone);
}

// Cleanup stale sessions every 5 minutes
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
  deleteSession,
};
