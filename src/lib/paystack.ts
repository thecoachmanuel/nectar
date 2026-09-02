import dbConnect from "@/lib/dbConnect";
import Setting from "@/models/Setting";
import PaymentGateway from "@/models/PaymentGateway";

export interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  isEnabled: boolean;
}

/**
 * Resolves active Paystack keys and status.
 * Priority:
 * 1. Admin Settings in MongoDB (Setting collection e.g. pay_paystack_secret)
 * 2. PaymentGateway collection in MongoDB (slug: "paystack")
 * 3. Fallback to process.env (PAYSTACK_SECRET_KEY / NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY)
 */
export async function getPaystackConfig(): Promise<PaystackConfig> {
  await dbConnect();

  // 1. First priority: Check Admin Settings (Setting collection)
  const secretSetting = await Setting.findOne({
    key: { $in: ["pay_paystack_secret", "paystack_secret_key", "paystack_secret"] },
  }).lean();

  const publicSetting = await Setting.findOne({
    key: { $in: ["pay_paystack_public", "paystack_public_key", "paystack_public"] },
  }).lean();

  const enabledSetting = await Setting.findOne({
    key: { $in: ["pay_paystack_enabled", "paystack_enabled"] },
  }).lean();

  let secretKey = (secretSetting as any)?.payload ? String((secretSetting as any).payload).trim() : "";
  let publicKey = (publicSetting as any)?.payload ? String((publicSetting as any).payload).trim() : "";
  let isEnabled = (enabledSetting as any)?.payload !== "No";

  // 2. Second priority: Check PaymentGateway collection
  if (!secretKey || !publicKey) {
    const gateway = await PaymentGateway.findOne({ slug: "paystack" }).lean();
    if (gateway && Array.isArray((gateway as any).options)) {
      if (!secretKey) {
        const opt = (gateway as any).options.find(
          (o: any) => o.option === "paystack_secret_key" || o.option === "secret_key"
        );
        if (opt && opt.value) secretKey = String(opt.value).trim();
      }
      if (!publicKey) {
        const opt = (gateway as any).options.find(
          (o: any) => o.option === "paystack_public_key" || o.option === "public_key"
        );
        if (opt && opt.value) publicKey = String(opt.value).trim();
      }
    }
  }

  // 3. Fallback: If admin has NOT configured it in settings, use environment variables from .env
  if (!secretKey) {
    secretKey = (process.env.PAYSTACK_SECRET_KEY || "").trim();
  }
  if (!publicKey) {
    publicKey = (
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
      process.env.PAYSTACK_PUBLIC_KEY ||
      ""
    ).trim();
  }

  return { secretKey, publicKey, isEnabled };
}
