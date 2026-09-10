import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Page from "@/models/Page";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

const defaultPages: Record<string, any> = {
  "about-us": {
    title: "About Errandshop Groceries",
    slug: "about-us",
    template_id: 0,
    description: `
      <h2>Fresh Groceries Delivered Right to Your Doorstep</h2>
      <p>Welcome to <strong>Errandshop</strong> — your premier online grocery and fresh food delivery destination. We connect local shoppers with the freshest farm-to-table produce, pantry staples, dairy, beverages, and daily household essentials, delivered in under 30 minutes.</p>
      
      <h3>Our Mission</h3>
      <p>At Errandshop, our mission is simple: to make healthy, top-quality groceries accessible and affordable for every household, backed by seamless online and WhatsApp ordering.</p>
      
      <h3>Why Choose Errandshop?</h3>
      <ul>
        <li><strong>100% Farm Fresh Quality:</strong> Hand-picked organic fruits, crisp vegetables, and premium cuts selected daily.</li>
        <li><strong>Lightning-Fast Delivery:</strong> Order online or via WhatsApp and receive your delivery right at your door.</li>
        <li><strong>Best Price Guarantee:</strong> Everyday wholesale and retail deals designed to give you maximum value.</li>
        <li><strong>Easy Multi-Channel Ordering:</strong> Order via web, PWA app, or direct WhatsApp checkout in seconds.</li>
      </ul>
    `,
  },
  "contact-us": {
    title: "Get in Touch With Us",
    slug: "contact-us",
    template_id: 1,
    description: `
      <p>Have questions about your order, delivery zones, or partnerships? Our dedicated customer care team is here to help you 7 days a week.</p>
    `,
  },
  "terms-conditions": {
    title: "Terms & Conditions",
    slug: "terms-conditions",
    template_id: 0,
    description: `
      <h2>Terms & Conditions</h2>
      <p>Welcome to Errandshop. By accessing our platform, placing orders, or using our WhatsApp ordering service, you agree to comply with and be bound by the following terms and conditions.</p>
      <h3>1. Order Placement & Acceptance</h3>
      <p>All orders placed through our website, PWA app, or WhatsApp bot are subject to product availability and confirmation of the order price.</p>
      <h3>2. Delivery & Fulfillment</h3>
      <p>Estimated delivery times are provided as guidelines. While we strive for instant delivery within our estimated windows, external factors such as traffic and weather may cause slight delays.</p>
      <h3>3. Returns & Refunds</h3>
      <p>Fresh items that do not meet our quality standards can be reported upon delivery for immediate replacement or store wallet credit.</p>
    `,
  },
  "privacy-policy": {
    title: "Privacy Policy — Errand Shop",
    slug: "privacy-policy",
    template_id: 0,
    description: `
      <h2>Privacy Policy — Errand Shop</h2>
      <p><strong>Effective Date:</strong> 13 August 2025</p>
      <p>At Errand Shop, we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.</p>
      
      <h3>1. Information We Collect</h3>
      <ul>
        <li><strong>Personal Identification Information:</strong> Name, phone number, email address, and delivery address.</li>
        <li><strong>Order Information:</strong> Items purchased, order history, and delivery preferences.</li>
        <li><strong>Payment Information:</strong> Transaction details (we do not store your full payment card information).</li>
        <li><strong>Location Data:</strong> If enabled, we use your approximate location only to facilitate deliveries to your address and to show delivery availability in your area.</li>
        <li><strong>Device Information:</strong> Device type, operating system, and app usage statistics for service improvement.</li>
      </ul>

      <h3>2. How We Use Your Information</h3>
      <ul>
        <li>Process and deliver your grocery orders.</li>
        <li>Provide customer support.</li>
        <li>Improve and personalize our services.</li>
        <li>Send important service notices (marketing communications are optional).</li>
        <li>Detect and prevent fraud or misuse of our platform.</li>
      </ul>

      <h3>3. Sharing of Information</h3>
      <p><strong>We do not sell your personal information.</strong> We may share it with:</p>
      <ul>
        <li><strong>Delivery Services:</strong> To deliver your groceries to your address.</li>
        <li><strong>Payment Processors:</strong> To process your transactions securely.</li>
        <li><strong>Legal Authorities:</strong> When required by law or to protect our legal rights.</li>
      </ul>

      <h3>4. Data Retention</h3>
      <p>We keep your personal information only as long as necessary to fulfill your orders, comply with legal requirements, or resolve disputes.</p>

      <h3>5. Security of Your Information</h3>
      <p>We implement reasonable physical, electronic, and managerial procedures to safeguard your data against loss, theft, and unauthorized access.</p>

      <h3>6. Your Rights</h3>
      <p>You have the right to:</p>
      <ul>
        <li>Update or correct your personal information.</li>
        <li>Delete your account and associated information.</li>
      </ul>

      <h3>7. Changes to This Policy</h3>
      <p>We may update this Privacy Policy from time to time. Changes will be posted on our app and/or website, with the updated date.</p>

      <h3>8. Contact Us</h3>
      <p>If you have questions about this Privacy Policy, please contact our support team.</p>
    `,
  },
  "faq": {
    title: "Frequently Asked Questions (FAQ)",
    slug: "faq",
    template_id: 0,
    description: `
      <h2>Frequently Asked Questions (FAQ)</h2>
      <p>Find quick answers to common questions about our services, orders, delivery, and payments.</p>
    `,
  },
  "frequently-asked-questions": {
    title: "Frequently Asked Questions (FAQ)",
    slug: "frequently-asked-questions",
    template_id: 0,
    description: `
      <h2>Frequently Asked Questions (FAQ)</h2>
      <p>Find quick answers to common questions about our services, orders, delivery, and payments.</p>
    `,
  },
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    let page = await Page.findOne({ slug, status: true }).lean();

    // Check if custom description is also provided via Setting 'about_us' or 'site_about_us'
    if (slug === "about-us") {
      const customAboutSetting = await Setting.findOne({
        key: { $in: ["company_about_us", "site_about_us", "about_us_content"] },
      }).lean();

      if (customAboutSetting && customAboutSetting.payload) {
        if (!page) {
          page = {
            title: "About Errandshop Groceries",
            slug: "about-us",
            description: customAboutSetting.payload,
            template_id: 0,
            status: true,
          } as any;
        } else if (customAboutSetting.payload.length > 20) {
          page.description = customAboutSetting.payload;
        }
      }
    }

    if (!page && defaultPages[slug]) {
      page = defaultPages[slug];
    }

    if (!page) {
      return NextResponse.json(
        { status: false, message: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, data: page });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
