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
  session.lastActivity = Date.now();
  return session;
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
};
