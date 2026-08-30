// ─── Payment Service ────────────────────────────────────────────────────────
// Handles Paystack link generation and Bank Transfer details from Admin settings

async function getFrontendAppUrl(db) {
  // 1. Check environment variables
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("onrender.com") && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.APP_URL && !process.env.APP_URL.includes("onrender.com") && !process.env.APP_URL.includes("localhost")) {
    return process.env.APP_URL.replace(/\/+$/, "");
  }

  // 2. Check MongoDB settings collection
  try {
    const settingsCollection = db.collection("settings");
    const siteUrlSetting = await settingsCollection.findOne({
      key: { $in: ["site_url", "app_url", "frontend_url", "wa_site_url"] }
    });

    if (siteUrlSetting && siteUrlSetting.payload) {
      const url = typeof siteUrlSetting.payload === "string" ? siteUrlSetting.payload.trim() : "";
      if (url.startsWith("http")) {
        return url.replace(/\/+$/, "");
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not read site_url setting from DB:", err.message);
  }

  // 3. Fallback to configured or typical Vercel app URL
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://nectar-app.vercel.app").replace(/\/+$/, "");
}

async function getBankAccountDetails(db) {
  try {
    const settingsCollection = db.collection("settings");
    
    // Look for dedicated WhatsApp bank account setting
    let setting = await settingsCollection.findOne({ key: "wa_bank_account" });
    if (setting && setting.payload) {
      const p = typeof setting.payload === "string" ? JSON.parse(setting.payload) : setting.payload;
      if (p.accountNumber && p.bankName) {
        return {
          bankName: p.bankName,
          accountNumber: p.accountNumber,
          accountName: p.accountName || "Nectar Groceries",
        };
      }
    }

    // Check generic bank_account key
    setting = await settingsCollection.findOne({ key: "bank_account" });
    if (setting && setting.payload) {
      const p = typeof setting.payload === "string" ? JSON.parse(setting.payload) : setting.payload;
      return {
        bankName: p.bankName || "Access Bank",
        accountNumber: p.accountNumber || "0123456789",
        accountName: p.accountName || "Nectar Groceries Ltd",
      };
    }
  } catch (err) {
    console.error("⚠️ Error reading bank account settings:", err.message);
  }

  // Fallback defaults if not yet configured by admin
  return {
    bankName: "Guaranty Trust Bank (GTBank)",
    accountNumber: "Contact Admin for Account",
    accountName: "Nectar Groceries",
  };
}

async function initializePaystackPayment(db, appUrlOverride, order) {
  const amountInKobo = Math.round(Number(order.totalAmount) * 100);
  const reference = `ps_wa_${order._id}_${Date.now()}`;
  const frontendUrl = await getFrontendAppUrl(db);

  // Strategy 1: Call Next.js Paystack Initialize API if possible
  try {
    const apiRes = await fetch(`${frontendUrl}/api/payments/paystack/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order._id.toString() }),
    });
    const data = await apiRes.json();
    if (data.status && data.authorizationUrl) {
      return {
        status: true,
        authorizationUrl: data.authorizationUrl,
        reference: data.reference || reference,
      };
    }
  } catch (apiErr) {
    console.warn("⚠️ Next.js Paystack init endpoint unreachable, trying direct Paystack API:", apiErr.message);
  }

  // Strategy 2: Direct Paystack API call using Secret Key stored in MongoDB
  try {
    const gatewaysCollection = db.collection("paymentgateways");
    const paystackGateway = await gatewaysCollection.findOne({ slug: "paystack" });
    let secretKey = process.env.PAYSTACK_SECRET_KEY || "";

    if (paystackGateway && Array.isArray(paystackGateway.options)) {
      const opt = paystackGateway.options.find((o) => o.option === "paystack_secret_key");
      if (opt && opt.value) secretKey = opt.value;
    }

    if (!secretKey) {
      throw new Error("Paystack secret key is not configured in settings or environment.");
    }

    const payload = {
      amount: amountInKobo,
      email: order.customerEmail || "customer@nectargroceries.com",
      reference: reference,
      callback_url: `${frontendUrl}/order/${order._id}?payment=paystack&ref=${reference}`,
      metadata: {
        orderId: order._id.toString(),
        orderSerialNo: order.orderSerialNo,
        source: "whatsapp",
      },
    };

    const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const psData = await psRes.json();
    if (psData.status && psData.data?.authorization_url) {
      // Save reference on order in MongoDB
      const ordersCollection = db.collection("orders");
      await ordersCollection.updateOne(
        { _id: order._id },
        { $set: { paymentReference: reference } }
      );

      return {
        status: true,
        authorizationUrl: psData.data.authorization_url,
        reference: reference,
      };
    } else {
      throw new Error(psData.message || "Paystack initialization rejected");
    }
  } catch (err) {
    console.error("❌ Paystack initialize error:", err.message);
    return {
      status: false,
      message: err.message,
    };
  }
}

module.exports = {
  getBankAccountDetails,
  initializePaystackPayment,
  getFrontendAppUrl,
};
