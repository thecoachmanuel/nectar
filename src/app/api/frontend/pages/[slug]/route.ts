import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Page from "@/models/Page";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

const defaultPages: Record<string, any> = {
  "about-us": {
    title: "About Nectar Groceries",
    slug: "about-us",
    template_id: 0,
    description: `
      <h2>Fresh Groceries Delivered Right to Your Doorstep</h2>
      <p>Welcome to <strong>Nectar</strong> — your premier online grocery and fresh food delivery destination. We connect local shoppers with the freshest farm-to-table produce, pantry staples, dairy, beverages, and daily household essentials, delivered in under 45 minutes.</p>
      
      <h3>Our Mission</h3>
      <p>At Nectar, our mission is simple: to make healthy, top-quality groceries accessible and affordable for every household, backed by seamless online and WhatsApp ordering.</p>
      
      <h3>Why Choose Nectar?</h3>
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
      <p>Welcome to Nectar. By accessing our platform, placing orders, or using our WhatsApp ordering service, you agree to comply with and be bound by the following terms and conditions.</p>
      <h3>1. Order Placement & Acceptance</h3>
      <p>All orders placed through our website, PWA app, or WhatsApp bot are subject to product availability and confirmation of the order price.</p>
      <h3>2. Delivery & Fulfillment</h3>
      <p>Estimated delivery times are provided as guidelines. While we strive for instant delivery within our estimated windows, external factors such as traffic and weather may cause slight delays.</p>
      <h3>3. Returns & Refunds</h3>
      <p>Fresh items that do not meet our quality standards can be reported upon delivery for immediate replacement or store wallet credit.</p>
    `,
  },
  "privacy-policy": {
    title: "Privacy Policy",
    slug: "privacy-policy",
    template_id: 0,
    description: `
      <h2>Privacy Policy</h2>
      <p>At Nectar, we are committed to protecting your personal privacy. We collect minimal customer information necessary to process your orders, deliver products to your specified address, and communicate order updates.</p>
      <h3>Data Security</h3>
      <p>We implement robust encryption and security standards to ensure your personal details, payment records, and address information are fully secure and never shared with unauthorized third parties.</p>
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
            title: "About Nectar Groceries",
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
