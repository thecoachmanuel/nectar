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
  const isKnown = session.isKnownUser && session.customerName;

  let greeting = "";
  if (isKnown) {
    const addressHint =
      session.savedAddresses && session.savedAddresses.length > 0
        ? `\n📍 _Saved delivery address available_`
        : "";
    greeting = `👋 Welcome back, *${session.customerName}*! ✨\n🌿 Ready to restock your fresh groceries with *Nectar*?${addressHint}`;
  } else {
    greeting = `🌿 *Welcome to Nectar Groceries!* 🥦\n\nFresh groceries delivered straight to your door.`;
  }

  const profileOption = isKnown ? `5️⃣ *My Profile & Addresses* 👤\n` : "";
  const replyHint = isKnown ? `_Reply *1*, *2*, *3*, *4*, or *5* to start_` : `_Reply *1*, *2*, *3*, or *4* to start_`;

  return (
    `${greeting}\n\n` +
    `How would you like to proceed today?\n\n` +
    `1️⃣ *Browse by Category* 📦\n` +
    `2️⃣ *Search for an Item* 🔍\n` +
    `3️⃣ *Track an Order* 🚚\n` +
    `4️⃣ *Submit Shopping Wishlist* 📝 _(Items you buy often)_\n` +
    profileOption +
    `\n${replyHint}\n` +
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

async function showCustomerProfileCard(db, session, phone, sendFn) {
  if (!session.isKnownUser && !session.customerName) {
    return sendFn(
      phone,
      `👤 *Customer Profile*\n\n` +
        `We haven't linked a registered account to this number (+${phone}) yet.\n\n` +
        `When you place your first order or register on our app, your addresses and history will be saved automatically!\n\n` +
        `_Reply *MENU* to browse groceries or *WISHLIST* to suggest items you buy often._`
    );
  }

  // Look up recent orders count
  let orderCount = 0;
  let lastOrderDate = "None yet";
  try {
    const ordersCollection = db.collection("orders");
    const query = [];
    if (session.userId && ObjectId.isValid(session.userId)) {
      query.push({ userId: new ObjectId(session.userId) });
    }
    const cleanPhone = userService.cleanDigits(phone);
    if (cleanPhone.length >= 7) {
      query.push({ customerPhone: { $regex: cleanPhone.slice(-9), $options: "i" } });
    }
    if (query.length > 0) {
      const orders = await ordersCollection
        .find({ $or: query })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      orderCount = orders.length;
      if (orders.length > 0 && orders[0].createdAt) {
        lastOrderDate = new Date(orders[0].createdAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }
  } catch (e) {}

  const addressLines =
    (session.savedAddresses || []).length > 0
      ? session.savedAddresses
          .map((a, i) => `  • ${a.address || "Address"} ${a.isDefault ? "*(Default)*" : ""}`)
          .join("\n")
      : "  • No saved address yet";

  return sendFn(
    phone,
    `👤 *Your Nectar Profile*\n\n` +
      `• *Name:* ${session.customerName || "Valued Customer"}\n` +
      `• *Phone:* ${session.customerPhone || "+" + phone}\n` +
      (session.customerEmail ? `• *Email:* ${session.customerEmail}\n` : "") +
      `• *Total Orders Placed:* ${orderCount}\n` +
      `• *Last Order Date:* ${lastOrderDate}\n\n` +
      `📍 *Saved Addresses:*\n${addressLines}\n\n` +
      `_Reply *1* to browse, *3* to track, *4* for wishlist, or *MENU*_`
  );
}

function startWishlistFlow(session, phone, sendFn) {
  session.step = "WISHLIST_COLLECT";
  session.wishlistItems = [];
  session.wishlistRawInput = "";

  const nameGreeting = session.customerName ? ` ${session.customerName}` : "";

  return sendFn(
    phone,
    `📝 *Submit Your Shopping Wishlist* 🛍️\n\n` +
      `Hi${nameGreeting}! We want to make sure Nectar stocks all the grocery items and brands you buy frequently.\n\n` +
      `Please tell us what products you buy often and would love to see on the app:\n\n` +
      `✍️ *Examples:*\n` +
      `• _Indomie Chicken 70g (Carton)_\n` +
      `• _Golden Penny Spaghetti 500g_\n` +
      `• _Dano Full Cream Milk 800g_\n` +
      `• _Devon King's Cooking Oil 5L_\n` +
      `• _Titus Sardines (Carton)_\n\n` +
      `_Send your items separated by commas or on separate lines:_\n` +
      `_(Type *CANCEL* anytime to exit)_`
  );
}

async function handleWishlistCollection(session, text, phone, sendFn) {
  const upper = text.toUpperCase();
  if (["CANCEL", "EXIT", "MENU"].includes(upper)) {
    sessionManager.resetToMenu(phone);
    return sendFn(phone, `Wishlist submission cancelled.\n\n` + buildWelcomeMenu(session));
  }

  // Parse items from comma or line breaks
  const items = text
    .split(/[\n,;]+/)
    .map((s) => s.trim().replace(/^[-*•\d.)\s]+/, ""))
    .filter((s) => s.length > 0);

  if (items.length === 0) {
    return sendFn(
      phone,
      `Please enter at least one grocery item (e.g. *Golden Penny Sugar, Peak Milk*):`
    );
  }

  session.wishlistRawInput = text;
  session.wishlistItems = items.map((name) => ({ name }));
  session.step = "WISHLIST_DETAILS";

  const preview = items.map((item, i) => `${i + 1}. *${item}*`).join("\n");

  return sendFn(
    phone,
    `✅ *Got it! We noted ${items.length} item${items.length === 1 ? "" : "s"}:*\n\n` +
      `${preview}\n\n` +
      `Would you like to add any preferred brands, package sizes, or extra notes?\n\n` +
      `• Type your preferred sizes/brands (e.g. _"1kg size only, carton packaging"_)\n` +
      `• Or reply *DONE* (or *1*) to submit now! 🚀`
  );
}

async function handleWishlistFinalize(db, appUrl, session, text, phone, sendFn) {
  const upper = text.toUpperCase();
  if (["CANCEL", "EXIT", "MENU"].includes(upper)) {
    sessionManager.resetToMenu(phone);
    return sendFn(phone, `Wishlist cancelled.\n\n` + buildWelcomeMenu(session));
  }

  let additionalNotes = "";
  if (!["DONE", "1", "NO", "SUBMIT", "OK", "FINISH", "NONE", "CONFIRM"].includes(upper)) {
    additionalNotes = text.trim();
  }

  const items = session.wishlistItems || [];
  if (items.length === 0 && session.wishlistRawInput) {
    items.push({ name: session.wishlistRawInput });
  }

  try {
    const shoppingWishlists = db.collection("shoppingwishlists");
    const customerName = session.customerName || (session.isKnownUser ? "Registered Customer" : "WhatsApp Customer");
    const customerPhone = session.customerPhone || userService.normalizeCustomerPhone(phone);

    let userObjId = null;
    if (session.userId && ObjectId.isValid(session.userId)) {
      userObjId = new ObjectId(session.userId);
    }

    const doc = {
      customerPhone,
      customerName,
      userId: userObjId,
      items: items.map((it) => ({
        name: it.name,
        brandOrSize: additionalNotes || undefined,
      })),
      rawInput: session.wishlistRawInput || text,
      status: "new",
      source: "whatsapp",
      adminNotes: additionalNotes ? `Customer note: ${additionalNotes}` : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await shoppingWishlists.insertOne(doc);
    console.log(`📝 Shopping wishlist saved for ${customerPhone}: ${items.length} items`);

    // Alert Admin WhatsApp number
    try {
      const adminSetting = await db.collection("settings").findOne({
        key: { $in: ["admin_notification_whatsapp_number", "wa_admin_notification_phone", "company_phone"] },
      });
      const adminPhone = adminSetting?.payload ? String(adminSetting.payload).replace(/\D/g, "") : null;
      if (adminPhone && adminPhone.length >= 7) {
        const itemsListStr = items.map((it, idx) => `${idx + 1}. *${it.name}*`).join("\n");
        const dateStr = new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

        const adminAlertText =
          `📝 *NEW CUSTOMER SHOPPING WISHLIST!* 🛒✨\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 *Customer:* ${customerName}\n` +
          `📱 *Phone:* +${customerPhone.replace(/^\+/, "")}\n` +
          `📅 *Date:* ${dateStr}\n\n` +
          `🛍️ *ITEMS REQUESTED (${items.length}):*\n` +
          `${itemsListStr}\n` +
          (additionalNotes ? `\n📝 *Notes / Sizes:* ${additionalNotes}\n` : "\n") +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `👉 *Manage Wishlists in Admin:*\n` +
          `${appUrl}/admin/shopping-wishlist`;

        sendFn(adminPhone, adminAlertText).catch((e) => console.error("Admin WA wishlist alert error:", e.message));
      }
    } catch (adminErr) {
      console.error("Admin notification failed:", adminErr.message);
    }

    // Reset session step
    session.wishlistItems = [];
    session.wishlistRawInput = "";
    session.step = "MAIN_MENU";

    return sendFn(
      phone,
      `🎉 *Thank you${session.customerName ? `, ${session.customerName}` : ""}!*\n\n` +
        `We've sent your *${items.length} requested item${items.length === 1 ? "" : "s"}* straight to our inventory sourcing team. 🥦📦\n\n` +
        `We'll work on stocking them and will notify you right here on WhatsApp as soon as they become available! ✨\n\n` +
        `_Reply with *MENU* anytime to browse our active grocery catalog._`
    );
  } catch (err) {
    console.error("Failed to save shopping wishlist:", err);
    session.step = "MAIN_MENU";
    return sendFn(
      phone,
      `⚠️ We received your items, but had a temporary error recording them. Our team has been alerted! Type *MENU* to continue.`
    );
  }
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
    "WISHLIST", "SUGGEST", "MY LIST", "REQUEST",
    "PROFILE", "ACCOUNT", "MY PROFILE", "ADDRESS", "ADDRESSES",
  ];

  const isHardCommand =
    ALWAYS_ON_COMMANDS.includes(upper) ||
    upper.startsWith("TRACK") ||
    upper.startsWith("ORDER") ||
    upper.startsWith("WISH") ||
    upper.startsWith("SUGGEST") ||
    upper.startsWith("PROFILE") ||
    upper.match(/^ORD-/i);

  // Active ordering funnel check:
  // When a customer is in the middle of picking items, entering name/phone/address, or choosing payment,
  // the bot MUST NEVER block or pause their checkout inputs.
  const isOrderingActive = Boolean(session.step && session.step !== "MAIN_MENU");

  // ── Bot Pause Check ────────────────────────────────────────────────────────
  // If the business has manually replied to this customer, the bot steps back
  // ONLY when the customer is idle in MAIN_MENU without an active checkout in progress.
  const { isBotPaused, resumeBot, getBotPauseRemainingMinutes } = sessionManager;
  
  if (isBotPaused(phone) && !isHardCommand && !isOrderingActive) {
    // Bot is paused & customer is idle — silently let message through for business to reply
    console.log(`⏸️  Bot paused for ${phone} (idle) — letting message through to business: "${text.substring(0, 40)}"`);
    return;
  }

  // If a command arrives or customer actively interacts in checkout, auto-resume bot
  if (isBotPaused(phone) && (isHardCommand || isOrderingActive)) {
    resumeBot(phone);
    console.log(`▶️  Customer actively checking out or used command — bot auto-resumed for ${phone}.`);
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

  // Wishlist shortcut command e.g. "WISHLIST", "SUGGEST", "MY LIST"
  if (
    ["WISHLIST", "SUGGEST", "MY LIST", "REQUEST"].includes(upper) ||
    upper.startsWith("WISHLIST") ||
    upper.startsWith("SUGGEST")
  ) {
    return startWishlistFlow(session, phone, sendFn);
  }

  // Profile shortcut command e.g. "PROFILE", "ACCOUNT", "MY PROFILE"
  if (
    ["PROFILE", "ACCOUNT", "MY PROFILE", "ADDRESS", "ADDRESSES"].includes(upper) ||
    upper.startsWith("PROFILE")
  ) {
    return showCustomerProfileCard(db, session, phone, sendFn);
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
        `• *WISHLIST* — Submit items you buy often 📝\n` +
        `• *PROFILE* — View account details & saved addresses 👤\n` +
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

      if (text === "4" || upper.includes("WISH") || upper.includes("SUGGEST") || upper.includes("LIST")) {
        return startWishlistFlow(session, phone, sendFn);
      }

      if (text === "5" || upper.includes("PROFILE") || upper.includes("ACCOUNT") || upper.includes("ADDRESS")) {
        return showCustomerProfileCard(db, session, phone, sendFn);
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
        `Please reply with *1* to browse, *2* to search, *3* to track, *4* for wishlist, or *5* for profile.\n\n` +
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

    // ── SHOPPING WISHLIST STEPS ─────────────────────────────────────────────
    case "WISHLIST_COLLECT": {
      return handleWishlistCollection(session, text, phone, sendFn);
    }

    case "WISHLIST_DETAILS": {
      return handleWishlistFinalize(db, appUrl, session, text, phone, sendFn);
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

    // ── Dispatch Instant Alert to Admin WhatsApp Notification Number ──
    try {
      const adminSetting = await db.collection("settings").findOne({
        key: { $in: ["admin_notification_whatsapp_number", "wa_admin_notification_phone", "company_phone"] }
      });
      const adminPhone = adminSetting?.payload ? String(adminSetting.payload).replace(/\D/g, "") : null;
      if (adminPhone && adminPhone.length >= 7 && adminPhone !== String(finalPhone).replace(/\D/g, "")) {
        const items = Array.isArray(order.items) ? order.items : [];
        const totalItemQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
        const itemsText = items.length > 0
          ? items.map((item, idx) => {
              const qty = item.quantity || 1;
              const price = item.itemTotal
                ? ` (₦${Number(item.itemTotal).toLocaleString()})`
                : item.price
                ? ` (₦${Number(item.price * qty).toLocaleString()})`
                : "";
              return `${idx + 1}. *${item.name}* x${qty}${price}`;
            }).join("\n")
          : "• Standard WhatsApp Basket";

        const formattedPaymentMethod = paymentMethod === "paystack" ? "💳 Paystack (Online)" : "🏦 Bank Transfer";
        const paymentStatusBadge = order.paymentStatus === "paid" ? "✅ PAID" : "⏳ UNPAID / PENDING";
        const dateStr = new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

        const adminAlertText =
          `🚨 *NEW WHATSAPP BOT ORDER!* 🛒✨\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `📋 *Order ID:* #${order.orderSerialNo}\n` +
          `📅 *Date:* ${dateStr}\n\n` +
          `👤 *CUSTOMER INFORMATION*\n` +
          `• *Name:* ${order.customerName || "WhatsApp Customer"}\n` +
          `• *Phone:* +${finalPhone}\n` +
          `• *Email:* ${order.customerEmail || "N/A"}\n\n` +
          `🛍️ *ORDERED ITEMS (${totalItemQuantity} item${totalItemQuantity === 1 ? "" : "s"})*\n` +
          `${itemsText}\n\n` +
          `💰 *BILLING & SUMMARY*\n` +
          `• *Subtotal:* ₦${Number(order.subtotal || 0).toLocaleString()}\n` +
          `• *Delivery Fee:* ₦${Number(order.deliveryCharge || 0).toLocaleString()}\n` +
          `• *TOTAL PAYABLE:* *₦${Number(order.totalAmount || 0).toLocaleString()}*\n\n` +
          `💳 *PAYMENT & FULFILLMENT*\n` +
          `• *Payment Method:* ${formattedPaymentMethod}\n` +
          `• *Payment Status:* ${paymentStatusBadge}\n` +
          `• *Order Type:* 🚚 Home Delivery\n` +
          `• *Delivery Address:* ${order.deliveryAddress?.address || "Provided via WhatsApp"}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `👉 *Open Admin Dashboard to Manage:*\n` +
          `${appUrl}/admin/orders`;

        sendFn(adminPhone, adminAlertText).catch((e) => console.error("Admin WA alert error:", e.message));
      }
    } catch (adminNotifErr) {
      console.error("Failed to notify admin on WA order:", adminNotifErr.message);
    }

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
