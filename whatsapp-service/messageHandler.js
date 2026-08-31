// ─── Message Handler ───────────────────────────────────────────────────────
// Conversational ordering bot state machine for Nectar Groceries with Product Variations, GPS Location, and Order Tracking

const { ObjectId } = require("mongodb");
const sessionManager = require("./sessionManager");
const userService = require("./userService");
const catalogService = require("./catalogService");
const paymentService = require("./paymentService");
const orderService = require("./orderService");
const geocodingService = require("./geocodingService");

function formatPrice(amount) {
  return Number(amount || 0).toLocaleString();
}

function buildCartSummary(cart) {
  if (!cart || cart.length === 0) {
    return "Your cart is currently empty.";
  }

  const lines = cart.map(
    (item, idx) =>
      `${idx + 1}️⃣ *${item.name}* x${item.quantity} — ₦${formatPrice(item.itemTotal)}`
  );

  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  return (
    `🛍️ *Your Nectar Cart*\n\n` +
    lines.join("\n") +
    `\n\n*Subtotal: ₦${formatPrice(subtotal)}*`
  );
}

function buildWelcomeMenu(session) {
  const greeting = session.isKnownUser && session.customerName
    ? `👋 Welcome back, *${session.customerName}*!\n\n🌿 Ready to restock your fresh groceries with *Nectar*?`
    : `🌿 *Welcome to Nectar Groceries!* 🥦\n\nFresh groceries delivered straight to your door.`;

  return (
    `${greeting}\n\n` +
    `How would you like to proceed today?\n\n` +
    `1️⃣ *Browse by Category*\n` +
    `2️⃣ *Search for an item*\n` +
    `3️⃣ *Track an Order* 🚚\n\n` +
    `_Reply *1*, *2*, or *3* to start_\n` +
    `_Type *CART* to view cart | *HELP* for commands_`
  );
}

function formatOrderStatusProgress(status) {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "pending":
      return "🟡 *Order Received (Pending)*\n_We have received your order and are confirming item availability._";
    case "confirmed":
    case "processing":
    case "preparing":
      return "🍳 *Confirmed & Preparing*\n_Our store team is carefully packing your fresh groceries._";
    case "out_for_delivery":
    case "on_the_way":
      return "🚚 *Out for Delivery*\n_Your rider is on the way to your delivery address!_";
    case "delivered":
      return "✅ *Delivered*\n_Your groceries have been safely delivered. Enjoy! 🥑_";
    case "cancelled":
    case "rejected":
      return "❌ *Cancelled*\n_This order was cancelled. Please contact customer support for details._";
    default:
      return `📦 *Status:* ${status.toUpperCase()}`;
  }
}

function handleItemSelection(session, selectedItem, sendFn, phone) {
  session.selectedItem = selectedItem;

  // Flatten all variation options if available
  const variationsList = [];
  if (Array.isArray(selectedItem.variations) && selectedItem.variations.length > 0) {
    for (const group of selectedItem.variations) {
      if (Array.isArray(group.options) && group.options.length > 0) {
        for (const opt of group.options) {
          if (opt.name && opt.name.trim()) {
            variationsList.push({
              groupName: group.name || "Option",
              name: opt.name.trim(),
              price: Number(opt.price) > 0 ? Number(opt.price) : Number(selectedItem.price),
            });
          }
        }
      }
    }
  }

  // If item has variations available, ask customer to choose
  if (variationsList.length > 0) {
    session.availableVariations = variationsList;
    session.selectedVariation = null;
    session.step = "VARIATION_CHOICE";

    const optionsText = variationsList
      .map((v, i) => `${i + 1}️⃣ ${v.name} — ₦${formatPrice(v.price)}`)
      .join("\n");

    return sendFn(
      phone,
      `🛒 *${selectedItem.name}*\n\nPlease choose your preferred variation / size:\n\n` +
        `${optionsText}\n\n` +
        `_Reply with a number (1 to ${variationsList.length}) to pick_\n` +
        `_Type *MENU* to go back_`
    );
  }

  // No variations: proceed directly to quantity
  session.selectedVariation = null;
  session.availableVariations = [];
  session.step = "QTY";

  return sendFn(
    phone,
    `🛒 You selected: *${selectedItem.name}* (₦${formatPrice(selectedItem.price)})\n\n` +
      `How many would you like?\n` +
      `_Reply with a quantity (e.g. 1, 2, 3...)_`
  );
}

async function startTrackOrderFlow(db, session, phone, directSerial, sendFn) {
  if (directSerial) {
    return showOrderTrackingCard(db, directSerial, phone, sendFn);
  }

  // Check if this phone/user has recent orders
  const ordersCollection = db.collection("orders");
  const query = [];
  if (session.userId && ObjectId.isValid(session.userId)) {
    query.push({ userId: new ObjectId(session.userId) });
  }
  const cleanPhone = userService.cleanDigits(phone);
  if (cleanPhone.length >= 7) {
    query.push({ customerPhone: { $regex: cleanPhone.slice(-9), $options: "i" } });
  }

  let recentOrders = [];
  if (query.length > 0) {
    try {
      recentOrders = await ordersCollection
        .find({ $or: query })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();
    } catch (e) {}
  }

  session.step = "TRACK_ORDER";

  if (recentOrders.length > 0) {
    session.recentOrders = recentOrders;
    const list = recentOrders
      .map(
        (o, idx) =>
          `${idx + 1}️⃣ *#${o.orderSerialNo}* (₦${formatPrice(o.totalAmount)}) — ${o.orderStatus?.replace("_", " ")?.toUpperCase()}`
      )
      .join("\n");

    return sendFn(
      phone,
      `🔍 *Track Your Order*\n\n` +
        `Your recent orders:\n` +
        `${list}\n\n` +
        `_Reply with *1*, *2*, or *3* to view details,\n` +
        `OR type any Order Number (e.g. ORD-7X9K2L):_\n\n` +
        `_Type *MENU* to go back_`
    );
  }

  session.recentOrders = [];
  return sendFn(
    phone,
    `🔍 *Track Your Order*\n\n` +
      `Please enter your *Order Number* (e.g. *ORD-7X9K2L*):\n\n` +
      `_Type *MENU* to go back to store_`
  );
}

async function showOrderTrackingCard(db, serialOrId, phone, sendFn) {
  let serial = String(serialOrId || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!serial.startsWith("ORD-") && serial.length === 6) {
    serial = "ORD-" + serial;
  }

  const ordersCollection = db.collection("orders");
  let order = null;

  try {
    order = await ordersCollection.findOne({
      $or: [
        { orderSerialNo: serial },
        { orderSerialNo: { $regex: new RegExp(`^${serial}$`, "i") } },
      ],
    });
  } catch (e) {}

  if (!order) {
    return sendFn(
      phone,
      `❌ We couldn't find an order matching "*${serialOrId}*".\n\n` +
        `Please verify the Order Number from your confirmation message (e.g. *ORD-7X9K2L*) and try again.\n\n` +
        `_Type *MENU* to return to store_`
    );
  }

  const frontendUrl = await paymentService.getFrontendAppUrl(db);
  const itemsList = Array.isArray(order.items)
    ? order.items.map((i) => `• ${i.name} x${i.quantity || 1}`).join("\n")
    : "Fresh Groceries";

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recent";
  const paymentBadge = order.paymentStatus === "paid" ? "✓ Paid" : "⏳ Pending Payment";

  return sendFn(
    phone,
    `📦 *Order Tracking: #${order.orderSerialNo}*\n` +
      `📅 Placed: ${orderDate}\n\n` +
      `${formatOrderStatusProgress(order.orderStatus)}\n\n` +
      `💳 *Payment:* ${paymentBadge} (${order.paymentMethod || "Bank Transfer"})\n` +
      `🛍️ *Items:*\n${itemsList}\n\n` +
      `💰 *Total Amount:* ₦${formatPrice(order.totalAmount)}\n` +
      `📍 *Delivery Address:*\n${order.deliveryAddress?.address || "Address provided"}\n\n` +
      `🌐 *Live Web Tracking & Receipt:*\n` +
      `👉 ${frontendUrl}/order/${order._id}\n\n` +
      `_Reply *TRACK* to check another order | *MENU* for store_`
  );
}

async function handleIncomingMessage(db, appUrl, phone, rawInput, sendFn) {
  // Check if input is a location object or text
  let text = "";
  let locationData = null;

  if (typeof rawInput === "object" && rawInput !== null && rawInput.type === "location") {
    locationData = rawInput;
    text = locationData.address || "WhatsApp Location Pin";
  } else {
    text = String(rawInput || "").trim();
  }

  if (!text && !locationData) return;

  const session = sessionManager.getSession(phone);
  const upper = text.toUpperCase();

  // ── Hard bot commands — these ALWAYS work even when bot is paused ──────────
  // The customer can always trigger core bot functions regardless of chat mode.
  const ALWAYS_ON_COMMANDS = [
    "MENU", "START", "HI", "HELLO", "HEY", "HOME",
    "CART", "VIEW CART", "BASKET",
    "CHECKOUT",
    "CLEAR", "CLEAR CART", "EMPTY",
    "HELP", "COMMANDS",
    "CANCEL", "EXIT",
    "MORE", "SHOP", "KEEP SHOPPING",
    "STATUS", "MY ORDER",
  ];

  const isHardCommand =
    ALWAYS_ON_COMMANDS.includes(upper) ||
    upper.startsWith("TRACK") ||
    upper.startsWith("ORDER") ||
    upper.match(/^ORD-/i);

  // ── Bot Pause Check ────────────────────────────────────────────────────────
  // If the business has manually replied to this customer, the bot steps back
  // to let them have a normal human conversation. Only hard commands break through.
  const { isBotPaused, resumeBot, getBotPauseRemainingMinutes } = sessionManager;
  
  if (isBotPaused(phone) && !isHardCommand) {
    // Bot is paused — silently let the message through (business is handling it)
    console.log(`⏸️  Bot paused for ${phone} — ignoring non-command message: "${text.substring(0, 40)}"`);
    return;
  }

  // If a hard command arrives while paused, auto-resume the bot
  if (isBotPaused(phone) && isHardCommand) {
    resumeBot(phone);
    console.log(`▶️  Customer used a bot command — bot auto-resumed for ${phone}.`);
  }

  // 1. Identify user on first interaction if not yet identified
  if (!session.userIdentified) {
    try {
      const user = await userService.findUserByPhone(db, phone);
      if (user) {
        session.userId = user._id ? user._id.toString() : null;
        session.customerName = user.name || null;
        session.customerEmail = user.email || null;
        session.customerPhone = user.phone || userService.normalizeCustomerPhone(phone);
        session.savedAddresses = Array.isArray(user.addresses) ? user.addresses : [];
        session.isKnownUser = true;
      }
    } catch (userErr) {
      console.warn("⚠️ User lookup failed:", userErr.message);
    }
    session.userIdentified = true;
  }

  // 2. Global shortcut commands
  if (["MENU", "START", "HI", "HELLO", "HEY", "HOME"].includes(upper)) {
    sessionManager.resetToMenu(phone);
    return sendFn(phone, buildWelcomeMenu(session));
  }

  // Track command with optional serial e.g. "TRACK ORD-123456"
  if (upper.startsWith("TRACK") || upper === "STATUS" || upper === "MY ORDER") {
    const parts = text.split(/\s+/);
    const directSerial = parts.length > 1 ? parts.slice(1).join(" ") : null;
    return startTrackOrderFlow(db, session, phone, directSerial, sendFn);
  }

  if (["CART", "VIEW CART", "BASKET"].includes(upper)) {
    if (session.cart.length === 0) {
      return sendFn(
        phone,
        `🛍️ Your cart is currently empty!\n\nType *MENU* to browse fresh groceries.`
      );
    }
    const cartText =
      `${buildCartSummary(session.cart)}\n\n` +
      `Reply:\n` +
      `• *CHECKOUT* — Place your order 🛒\n` +
      `• *MORE* or *MENU* — Keep shopping 🥦\n` +
      `• *CLEAR* — Empty your cart`;
    session.step = "CART";
    return sendFn(phone, cartText);
  }

  if (["CLEAR", "CLEAR CART", "EMPTY"].includes(upper)) {
    sessionManager.clearCart(phone);
    return sendFn(
      phone,
      `🗑️ Your cart has been cleared.\n\nType *MENU* to start shopping again.`
    );
  }

  if (["HELP", "COMMANDS"].includes(upper)) {
    return sendFn(
      phone,
      `🌿 *Nectar WhatsApp Assistant*\n\n` +
        `Here are the commands you can use anytime:\n` +
        `• *MENU* — Main store menu\n` +
        `• *TRACK* — Track your order status 🚚\n` +
        `• *CART* — View your shopping cart\n` +
        `• *CHECKOUT* — Place your order\n` +
        `• *CLEAR* — Empty your cart\n` +
        `• *CANCEL* — Return to main menu\n\n` +
        `_Reply with *MENU* to browse groceries._`
    );
  }

  if (["CANCEL", "EXIT"].includes(upper)) {
    sessionManager.resetToMenu(phone);
    return sendFn(
      phone,
      `Cancelled. Returned to main menu.\n\n` + buildWelcomeMenu(session)
    );
  }

  if (["MORE", "SHOP", "KEEP SHOPPING"].includes(upper)) {
    sessionManager.resetToMenu(phone);
    return sendFn(phone, buildWelcomeMenu(session));
  }

  // 3. Step-by-step state machine
  switch (session.step) {
    // ── MAIN MENU ──────────────────────────────────────────────────────────
    case "MAIN_MENU": {
      if (text === "1" || upper.includes("BROWSE") || upper.includes("CATEGOR")) {
        const categories = await catalogService.getCategories(db);
        if (!categories || categories.length === 0) {
          return sendFn(
            phone,
            `No categories available right now. Please try searching by item name (reply *2*).`
          );
        }

        session.browseCategories = categories;
        session.step = "BROWSE_CATEGORIES";

        const catList = categories
          .map((cat, idx) => `${idx + 1}️⃣ ${cat.name}`)
          .join("\n");

        return sendFn(
          phone,
          `📦 *Our Grocery Categories*\n\n` +
            `Reply with a number to view items:\n\n` +
            `${catList}\n\n` +
            `_Type *MENU* to go back_`
        );
      }

      if (text === "2" || upper.includes("SEARCH")) {
        session.step = "SEARCH_QUERY";
        return sendFn(
          phone,
          `🔍 *Search Nectar Groceries*\n\n` +
            `What item are you looking for?\n` +
            `(e.g. "tomatoes", "milk", "avocado", "bread")\n\n` +
            `_Type *MENU* to go back_`
        );
      }

      if (text === "3" || upper.includes("TRACK")) {
        return startTrackOrderFlow(db, session, phone, null, sendFn);
      }

      if (upper === "CHECKOUT") {
        if (session.cart.length === 0) {
          return sendFn(
            phone,
            `Your cart is empty! Type *MENU* to pick some fresh groceries first.`
          );
        }
        return startCheckoutFlow(session, phone, sendFn);
      }

      return sendFn(
        phone,
        `Please reply with *1* to browse, *2* to search, or *3* to track an order.\n\n` +
          buildWelcomeMenu(session)
      );
    }

    // ── TRACK ORDER INPUT ──────────────────────────────────────────────────
    case "TRACK_ORDER": {
      // Check if user selected from recent orders list (e.g. "1", "2", "3")
      const numIdx = parseInt(text, 10) - 1;
      if (!isNaN(numIdx) && numIdx >= 0 && numIdx < (session.recentOrders || []).length) {
        const selectedOrder = session.recentOrders[numIdx];
        session.step = "MAIN_MENU";
        return showOrderTrackingCard(db, selectedOrder.orderSerialNo, phone, sendFn);
      }

      // Look up by typed order number
      session.step = "MAIN_MENU";
      return showOrderTrackingCard(db, text, phone, sendFn);
    }

    // ── BROWSE CATEGORIES ──────────────────────────────────────────────────
    case "BROWSE_CATEGORIES": {
      const idx = parseInt(text, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= (session.browseCategories || []).length) {
        return sendFn(
          phone,
          `Please reply with a valid category number (1 to ${session.browseCategories.length}), or type *MENU* to go back.`
        );
      }

      const selectedCat = session.browseCategories[idx];
      const items = await catalogService.getItemsByCategory(db, selectedCat.id);

      if (!items || items.length === 0) {
        return sendFn(
          phone,
          `No active items found in *${selectedCat.name}* at the moment.\n\nType *MENU* to pick another category.`
        );
      }

      session.browseCategory = selectedCat;
      session.browseItems = items;
      session.step = "BROWSE_ITEMS";

      const itemsList = items
        .map((item, i) => `${i + 1}️⃣ ${item.name} — ₦${formatPrice(item.price)}`)
        .join("\n");

      return sendFn(
        phone,
        `🛒 *${selectedCat.name}*\n\n` +
          `Reply with a number to select an item:\n\n` +
          `${itemsList}\n\n` +
          `_Type *MENU* to go back to categories_`
      );
    }

    // ── BROWSE ITEMS ───────────────────────────────────────────────────────
    case "BROWSE_ITEMS": {
      const idx = parseInt(text, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= (session.browseItems || []).length) {
        return sendFn(
          phone,
          `Please reply with a valid item number (1 to ${session.browseItems.length}), or type *MENU* to go back.`
        );
      }

      const selectedItem = session.browseItems[idx];
      return handleItemSelection(session, selectedItem, sendFn, phone);
    }

    // ── SEARCH QUERY ───────────────────────────────────────────────────────
    case "SEARCH_QUERY": {
      const results = await catalogService.searchItems(db, text);
      if (!results || results.length === 0) {
        return sendFn(
          phone,
          `😔 No groceries found matching "*${text}*".\n\n` +
            `Try a different keyword or type *MENU* to browse our categories.`
        );
      }

      session.searchResults = results;
      session.step = "SEARCH_RESULTS";

      const resultsList = results
        .map((item, i) => `${i + 1}️⃣ ${item.name} — ₦${formatPrice(item.price)}`)
        .join("\n");

      return sendFn(
        phone,
        `🔍 *Results for "${text}"*\n\n` +
          `Reply with a number to select:\n\n` +
          `${resultsList}\n\n` +
          `_Type *MENU* to go back_`
      );
    }

    // ── SEARCH RESULTS ─────────────────────────────────────────────────────
    case "SEARCH_RESULTS": {
      const idx = parseInt(text, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= (session.searchResults || []).length) {
        return sendFn(
          phone,
          `Please reply with a valid number (1 to ${session.searchResults.length}), or type *MENU* to go back.`
        );
      }

      const selectedItem = session.searchResults[idx];
      return handleItemSelection(session, selectedItem, sendFn, phone);
    }

    // ── VARIATION CHOICE ───────────────────────────────────────────────────
    case "VARIATION_CHOICE": {
      const idx = parseInt(text, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= (session.availableVariations || []).length) {
        return sendFn(
          phone,
          `Please reply with a valid number (1 to ${session.availableVariations.length}), or type *MENU* to go back.`
        );
      }

      const pickedVar = session.availableVariations[idx];
      session.selectedVariation = pickedVar;
      session.step = "QTY";

      return sendFn(
        phone,
        `🛒 You selected: *${session.selectedItem.name} (${pickedVar.name})* — ₦${formatPrice(pickedVar.price)}\n\n` +
          `How many would you like?\n` +
          `_Reply with a quantity (e.g. 1, 2, 3...)_`
      );
    }

    // ── QUANTITY INPUT ─────────────────────────────────────────────────────
    case "QTY": {
      const qty = parseInt(text, 10);
      if (isNaN(qty) || qty < 1 || qty > 99) {
        return sendFn(
          phone,
          `Please reply with a valid quantity between 1 and 99 (e.g. 1, 2, 5).`
        );
      }

      const item = session.selectedItem;
      if (!item) {
        session.step = "MAIN_MENU";
        return sendFn(phone, `Session expired. ${buildWelcomeMenu(session)}`);
      }

      const effectivePrice = session.selectedVariation ? session.selectedVariation.price : item.price;
      const itemName = session.selectedVariation
        ? `${item.name} (${session.selectedVariation.name})`
        : item.name;
      const cartKey = session.selectedVariation
        ? `${item.id}_${session.selectedVariation.name}`
        : item.id;

      // Add to cart
      const existingIdx = session.cart.findIndex(
        (i) => i.cartKey === cartKey || (!session.selectedVariation && (i.itemId === item.id || i.id === item.id))
      );

      if (existingIdx >= 0) {
        session.cart[existingIdx].quantity += qty;
        session.cart[existingIdx].itemTotal =
          session.cart[existingIdx].quantity * session.cart[existingIdx].price;
      } else {
        session.cart.push({
          cartKey,
          itemId: item.id,
          name: itemName,
          variationName: session.selectedVariation ? session.selectedVariation.name : undefined,
          price: effectivePrice,
          quantity: qty,
          itemTotal: qty * effectivePrice,
        });
      }

      session.selectedItem = null;
      session.selectedVariation = null;
      session.availableVariations = [];
      session.step = "CART";

      return sendFn(
        phone,
        `✅ Added *${qty}x ${itemName}* to your cart!\n\n` +
          `${buildCartSummary(session.cart)}\n\n` +
          `Reply:\n` +
          `• *CHECKOUT* — Place your order now 🛒\n` +
          `• *MORE* or *MENU* — Keep shopping 🥦\n` +
          `• *CLEAR* — Empty cart`
      );
    }

    // ── CART STEP ──────────────────────────────────────────────────────────
    case "CART": {
      if (upper === "CHECKOUT") {
        if (session.cart.length === 0) {
          return sendFn(
            phone,
            `Your cart is empty! Type *MENU* to add items first.`
          );
        }
        return startCheckoutFlow(session, phone, sendFn);
      }

      if (["MORE", "MENU"].includes(upper)) {
        sessionManager.resetToMenu(phone);
        return sendFn(phone, buildWelcomeMenu(session));
      }

      return sendFn(
        phone,
        `Reply *CHECKOUT* to complete your order, *MORE* to continue shopping, or *CLEAR* to empty your cart.`
      );
    }

    // ── GUEST NAME INPUT ───────────────────────────────────────────────────
    case "NAME": {
      if (text.length < 2) {
        return sendFn(phone, `Please enter your full name:`);
      }
      session.customerName = text;
      session.step = "PHONE";

      return sendFn(
        phone,
        `📱 What is your phone number for order updates & delivery calls?\n(e.g. 08012345678)`
      );
    }

    // ── PHONE INPUT ────────────────────────────────────────────────────────
    case "PHONE": {
      const clean = userService.cleanDigits(text);
      if (clean.length < 9 || clean.length > 15) {
        return sendFn(
          phone,
          `Please provide a valid 11-digit Nigerian phone number (e.g. 08012345678):`
        );
      }

      session.customerPhone = userService.normalizeCustomerPhone(text);

      // Check if user has an account with this entered phone number!
      try {
        const foundUser = await userService.findUserByPhone(db, text);
        if (foundUser) {
          session.userId = foundUser._id ? foundUser._id.toString() : null;
          session.customerName = foundUser.name || session.customerName;
          session.customerEmail = foundUser.email || session.customerEmail;
          session.savedAddresses = Array.isArray(foundUser.addresses) ? foundUser.addresses : [];
          session.isKnownUser = true;
          console.log(`🔗 Linked WhatsApp order to existing account: ${foundUser.name}`);
        }
      } catch (e) {}

      session.step = "ADDRESS";

      return sendAddressPrompt(session, phone, sendFn);
    }

    // ── ADDRESS INPUT (Text or Location Pin) ───────────────────────────────
    case "ADDRESS": {
      if (locationData) {
        session.latitude = locationData.latitude;
        session.longitude = locationData.longitude;
        session.deliveryAddress = locationData.address || `GPS Location (${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)})`;
        return showPaymentOptions(db, session, phone, sendFn);
      }

      // Validate & Geocode text address
      const geoResult = await geocodingService.geocodeAddress(db, text);
      if (!geoResult.success) {
        return sendFn(
          phone,
          `⚠️ *Please provide more address detail!*\n\n` +
            `To ensure our rider finds you and your delivery fee is accurate, please include:\n` +
            `• House / Flat No & Street Name\n` +
            `• Area or Estate Name\n` +
            `• Nearest Landmark (e.g. Opposite Zenith Bank, yellow gate)\n\n` +
            `🌟 *Or simply tap 📎 (or +) ➔ Location to share your GPS Pin!*`
        );
      }

      session.deliveryAddress = geoResult.formattedAddress;
      session.latitude = geoResult.latitude;
      session.longitude = geoResult.longitude;

      return showPaymentOptions(db, session, phone, sendFn);
    }

    // ── USE SAVED ADDRESS CONFIRMATION ─────────────────────────────────────
    case "USE_SAVED_ADDRESS": {
      if (["YES", "1", "Y", "OK", "CONFIRM", "USE SAVED"].includes(upper)) {
        // Keeps pre-filled session.deliveryAddress and its coordinates if available
        return showPaymentOptions(db, session, phone, sendFn);
      }

      // If user sent a location pin instead
      if (locationData) {
        session.latitude = locationData.latitude;
        session.longitude = locationData.longitude;
        session.deliveryAddress = locationData.address || `GPS Location (${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)})`;
        return showPaymentOptions(db, session, phone, sendFn);
      }

      // Validate new text address
      const geoResult = await geocodingService.geocodeAddress(db, text);
      if (!geoResult.success) {
        return sendFn(
          phone,
          `⚠️ *Please provide more address detail!*\n\n` +
            `Include your House/Flat No, Street Name, Area, and Nearest Landmark:\n\n` +
            `🌟 *Or tap 📎 ➔ Location to share your GPS Pin!*`
        );
      }

      session.deliveryAddress = geoResult.formattedAddress;
      session.latitude = geoResult.latitude;
      session.longitude = geoResult.longitude;

      return showPaymentOptions(db, session, phone, sendFn);
    }

    // ── PAYMENT METHOD SELECTION ───────────────────────────────────────────
    case "PAYMENT_CHOICE": {
      if (text === "1" || upper.includes("PAYSTACK") || upper.includes("CARD")) {
        return processOrderPlacement(db, appUrl, session, phone, "paystack", sendFn);
      }

      if (text === "2" || upper.includes("BANK") || upper.includes("TRANSFER")) {
        return processOrderPlacement(db, appUrl, session, phone, "bank_transfer", sendFn);
      }

      return sendFn(
        phone,
        `Please reply with:\n` +
          `*1* — Pay with Paystack (Instant secure online link)\n` +
          `*2* — Pay via Bank Transfer (Direct account transfer)`
      );
    }

    default: {
      sessionManager.resetToMenu(phone);
      return sendFn(phone, buildWelcomeMenu(session));
    }
  }
}

// ─── Helper Functions ──────────────────────────────────────────────────────

function sendAddressPrompt(session, phone, sendFn) {
  return sendFn(
    phone,
    `📍 *Where should we deliver your order?*\n\n` +
      `🌟 *Fastest & Most Accurate:* \n` +
      `👉 Tap *📎* (or *+*) ➔ *Location* ➔ *Send Your Current Location*\n\n` +
      `✍️ *Or reply with your full address:*\n` +
      `House/Flat No, Street Name, Area & Nearest Landmark\n` +
      `_(e.g. 14 Admiralty Way, Lekki Phase 1, Opposite Zenith Bank)_`
  );
}

async function startCheckoutFlow(session, phone, sendFn) {
  // If known customer with saved address
  if (session.isKnownUser && session.savedAddresses && session.savedAddresses.length > 0) {
    const defaultAddr =
      session.savedAddresses.find((a) => a.isDefault) ||
      session.savedAddresses[0];
    session.deliveryAddress = defaultAddr.address;
    session.latitude = defaultAddr.latitude;
    session.longitude = defaultAddr.longitude;
    session.customerPhone = session.customerPhone || userService.normalizeCustomerPhone(phone);
    session.step = "USE_SAVED_ADDRESS";

    return sendFn(
      phone,
      `📍 We found your saved delivery address:\n` +
        `*${session.deliveryAddress}*\n\n` +
        `Reply *YES* to use this address,\n` +
        `OR send a new address / tap *📎 ➔ Location* for a GPS pin:`
    );
  }

  // If known customer without saved address
  if (session.isKnownUser && session.customerName) {
    session.customerPhone = session.customerPhone || userService.normalizeCustomerPhone(phone);
    session.step = "ADDRESS";
    return sendAddressPrompt(session, phone, sendFn);
  }

  // If new guest customer
  session.step = "NAME";
  return sendFn(
    phone,
    `🛒 *Checkout*\n\nTo place your order, what is your *full name*?`
  );
}

async function showPaymentOptions(db, session, phone, sendFn) {
  const subtotal = session.cart.reduce((sum, item) => sum + item.itemTotal, 0);

  // Dynamic delivery fee calculation
  const deliveryCalc = await orderService.calculateDeliveryFee(db, {
    cart: session.cart,
    subtotal,
    latitude: session.latitude,
    longitude: session.longitude,
    address: session.deliveryAddress,
  });

  const deliveryFee = deliveryCalc.deliveryCharge;
  session.deliveryCharge = deliveryFee;
  const total = subtotal + deliveryFee;

  const cartLines = session.cart
    .map((item) => `• ${item.name} x${item.quantity} — ₦${formatPrice(item.itemTotal)}`)
    .join("\n");

  let deliveryNote = `• Delivery: ₦${formatPrice(deliveryFee)}`;
  if (deliveryCalc.isFree) {
    deliveryNote = `• Delivery: *FREE* (Order over threshold 🎉)`;
  } else if (deliveryCalc.distanceKm) {
    deliveryNote = `• Delivery: ₦${formatPrice(deliveryFee)} (${deliveryCalc.distanceKm} km)`;
  }

  session.step = "PAYMENT_CHOICE";

  return sendFn(
    phone,
    `📋 *Order Summary for ${session.customerName || "Customer"}*\n\n` +
      `${cartLines}\n\n` +
      `• Subtotal: ₦${formatPrice(subtotal)}\n` +
      `${deliveryNote}\n` +
      `• *Total: ₦${formatPrice(total)}*\n\n` +
      `📍 *Delivery Address:*\n${session.deliveryAddress}\n\n` +
      `💳 *How would you like to pay?*\n` +
      `1️⃣ *Pay with Paystack* (Instant online payment link)\n` +
      `2️⃣ *Pay via Bank Transfer* (Direct account transfer)\n\n` +
      `_Reply *1* or *2* to place order_`
  );
}

async function processOrderPlacement(db, appUrl, session, phone, paymentMethod, sendFn) {
  try {
    const finalPhone = session.customerPhone || userService.normalizeCustomerPhone(phone);

    const order = await orderService.createWhatsAppOrder(db, {
      cart: session.cart,
      customerName: session.customerName,
      customerEmail: session.customerEmail,
      customerPhone: finalPhone,
      deliveryAddress: session.deliveryAddress,
      latitude: session.latitude,
      longitude: session.longitude,
      deliveryCharge: session.deliveryCharge,
      paymentMethod,
      userId: session.userId,
    });

    // ── Paystack Option ──
    if (paymentMethod === "paystack") {
      const psResult = await paymentService.initializePaystackPayment(db, appUrl, order);

      if (psResult.status && psResult.authorizationUrl) {
        sessionManager.clearCart(phone);

        return sendFn(
          phone,
          `🎉 *Order #${order.orderSerialNo} Placed!* 🛒✨\n\n` +
            `Total: *₦${formatPrice(order.totalAmount)}*\n\n` +
            `Please click the secure link below to complete your payment:\n` +
            `👉 ${psResult.authorizationUrl}\n\n` +
            `Once paid, our store team will confirm and dispatch your groceries! 🥦🚚\n\n` +
            `_Thank you for choosing Nectar!_`
        );
      }
    }

    // ── Bank Transfer Option ──
    const bank = await paymentService.getBankAccountDetails(db);
    sessionManager.clearCart(phone);

    const guestTip = !session.isKnownUser
      ? `\n\n💡 _Tip: Next time, orders linked to your phone number will save your details automatically!_`
      : "";

    return sendFn(
      phone,
      `🎉 *Order #${order.orderSerialNo} Placed!* 🛒✨\n\n` +
        `Total: *₦${formatPrice(order.totalAmount)}*\n\n` +
        `Please transfer *₦${formatPrice(order.totalAmount)}* to:\n\n` +
        `🏦 *Bank:* ${bank.bankName}\n` +
        `💳 *Account Number:* ${bank.accountNumber}\n` +
        `👤 *Account Name:* ${bank.accountName}\n` +
        `📋 *Reference:* *${order.orderSerialNo}*\n\n` +
        `Kindly send your payment proof here once done. Our team will verify and dispatch your fresh package! 🥑📦` +
        guestTip
    );
  } catch (err) {
    console.error("❌ Failed to process WhatsApp order:", err.message);
    return sendFn(
      phone,
      `⚠️ Sorry, there was an issue processing your order (${err.message}). Please try again or type *MENU*.`
    );
  }
}

module.exports = {
  handleIncomingMessage,
};
