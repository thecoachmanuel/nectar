import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Store from "@/models/Store";
import ItemCategory from "@/models/ItemCategory";
import Item from "@/models/Item";
import PaymentGateway from "@/models/PaymentGateway";
import Banner from "@/models/Banner";
import Offer from "@/models/Offer";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Seed Admin User
    const existingAdmin = await User.findOne({ email: "admin@example.com" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("123456", 10);
      await User.create({
        name: "John Doe",
        email: "admin@example.com",
        phone: "1254875855",
        password: hashedPassword,
        role: "admin",
        storeId: 0,
        status: true,
        addresses: [
          {
            label: "Home",
            address: "Main City Center",
            apartment: "Apt 101",
            latitude: 23.8069,
            longitude: 90.3687,
            isDefault: true,
          },
        ],
        permissions: ["all"],
      });
    }

    // 2. Seed Demo Customer User
    const existingCustomer = await User.findOne({ email: "customer@example.com" });
    if (!existingCustomer) {
      const hashedPassword = await bcrypt.hash("123456", 10);
      await User.create({
        name: "Will Smith",
        email: "customer@example.com",
        phone: "125333344",
        password: hashedPassword,
        role: "customer",
        storeId: 0,
        status: true,
        addresses: [
          {
            label: "Home",
            address: "123 Main Street",
            apartment: "Suite 4B",
            latitude: 23.7956,
            longitude: 90.3537,
            isDefault: true,
          },
        ],
      });
    }

    // 3. Seed Default Store
    let store = await Store.findOne({ name: "Main Store" });
    if (!store) {
      store = await Store.create({
        name: "Main Store",
        email: "mainstore@nectar.com",
        phone: "+1800123456",
        address: "Downtown City Center, 5th Avenue",
        latitude: 23.8069,
        longitude: 90.3687,
        city: "Main City",
        status: true,
        zone: {
          type: "Polygon",
          coordinates: [
            [
              [90.3, 23.7],
              [90.45, 23.7],
              [90.45, 23.85],
              [90.3, 23.85],
              [90.3, 23.7],
            ],
          ],
        },
        timeSlots: [
          { day: "Monday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Tuesday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Wednesday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Thursday", openingTime: "08:00 AM", closingTime: "10:00 PM", isClosed: false },
          { day: "Friday", openingTime: "08:00 AM", closingTime: "11:00 PM", isClosed: false },
          { day: "Saturday", openingTime: "09:00 AM", closingTime: "11:00 PM", isClosed: false },
          { day: "Sunday", openingTime: "09:00 AM", closingTime: "10:00 PM", isClosed: false },
        ],
      });
    }

    // 4. Seed Categories
    const categoriesData = [
      { name: "Flame Grill Burgers", slug: "flame-grill-burgers", sortOrder: 1, image: "/images/seeder/item-category/flame_grill_burgers.png" },
      { name: "Appetizers", slug: "appetizers", sortOrder: 2, image: "/images/seeder/item-category/appetizers.png" },
      { name: "Beverages", slug: "beverages", sortOrder: 3, image: "/images/seeder/item-category/beverages.png" },
      { name: "House Special Salads", slug: "house-special-salads", sortOrder: 4, image: "/images/seeder/item-category/house_special_salads.png" },
      { name: "Seafood Entrees", slug: "seafood-entrees", sortOrder: 5, image: "/images/seeder/item-category/seafood_entrees.png" },
    ];

    const categoryDocs: any = {};
    for (const cat of categoriesData) {
      let category = await ItemCategory.findOne({ slug: cat.slug });
      if (!category) {
        category = await ItemCategory.create(cat);
      }
      categoryDocs[cat.slug] = category._id;
    }

    // 5. Seed Food Items
    const itemsData: Array<{
      name: string;
      slug: string;
      categoryId: any;
      description: string;
      price: number;
      itemType: "veg" | "non_veg";
      status: boolean;
      isFeatured: boolean;
      image: string;
      variations: Array<{ name: string; options: Array<{ name: string; price: number }> }>;
      extras: Array<{ name: string; price: number }>;
    }> = [
      {
        name: "Whopper Burger",
        slug: "whopper-burger",
        categoryId: categoryDocs["flame-grill-burgers"],
        description: "Flame-grilled beef patty topped with juicy tomatoes, fresh lettuce, mayo, ketchup, crunchy pickles, and sliced white onions on a toasted sesame seed bun.",
        price: 12.99,
        itemType: "non_veg",
        status: true,
        isFeatured: true,
        image: "/images/seeder/item/whopper.png",
        variations: [
          {
            name: "Size",
            options: [
              { name: "Single Patty", price: 12.99 },
              { name: "Double Patty", price: 16.99 },
            ],
          },
        ],
        extras: [
          { name: "Extra Melted Cheese", price: 1.5 },
          { name: "Crispy Bacon Strip", price: 2.0 },
        ],
      },
      {
        name: "American BBQ Double",
        slug: "american-bbq-double",
        categoryId: categoryDocs["flame-grill-burgers"],
        description: "Two flame-grilled beef patties with crispy bacon, melted American cheese, and rich smokey BBQ sauce.",
        price: 14.5,
        itemType: "non_veg",
        status: true,
        isFeatured: true,
        image: "/images/seeder/item/american_bbq_double.png",
        variations: [
          {
            name: "Size",
            options: [
              { name: "Regular", price: 14.5 },
              { name: "Large Combo", price: 18.5 },
            ],
          },
        ],
        extras: [{ name: "Extra Sauce", price: 0.75 }],
      },
      {
        name: "French Fries",
        slug: "french-fries",
        categoryId: categoryDocs["appetizers"],
        description: "Golden, crispy French fries lightly salted to perfection.",
        price: 4.99,
        itemType: "veg",
        status: true,
        isFeatured: true,
        image: "/images/seeder/item/french_fries.png",
        variations: [
          {
            name: "Portion",
            options: [
              { name: "Medium", price: 4.99 },
              { name: "Large", price: 6.5 },
            ],
          },
        ],
        extras: [{ name: "Cheese Dip", price: 1.25 }],
      },
      {
        name: "Homemade Lemonade",
        slug: "homemade-lemonade",
        categoryId: categoryDocs["beverages"],
        description: "Freshly squeezed lemons with mint and pure cane sugar.",
        price: 3.5,
        itemType: "veg",
        status: true,
        isFeatured: false,
        image: "/images/seeder/item/homemade_lemonade.png",
        variations: [],
        extras: [],
      },
      {
        name: "Classic Caesar Salad",
        slug: "classic-caesar-salad",
        categoryId: categoryDocs["house-special-salads"],
        description: "Crisp romaine lettuce, garlic croutons, shredded parmesan cheese, and creamy Caesar dressing.",
        price: 9.99,
        itemType: "veg",
        status: true,
        isFeatured: false,
        image: "/images/seeder/item/classic_caesar_salad.png",
        variations: [],
        extras: [{ name: "Grilled Chicken Breast", price: 3.5 }],
      },
    ];

    for (const it of itemsData) {
      const existingItem = await Item.findOne({ slug: it.slug });
      if (!existingItem && it.categoryId) {
        await Item.create(it);
      }
    }

    // 6. Seed Paystack Payment Gateway Setup
    const paystack = await PaymentGateway.findOne({ slug: "paystack" });
    if (!paystack) {
      await PaymentGateway.create({
        name: "Paystack",
        slug: "paystack",
        status: true,
        options: [
          { option: "paystack_public_key", value: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_paystack_public_key_123" },
          { option: "paystack_secret_key", value: process.env.PAYSTACK_SECRET_KEY || "sk_test_paystack_secret_key_123" },
        ],
      });
    }

    // 7. Seed Offers
    const { default: Offer } = await import("@/models/Offer");
    const offersData = [
      {
        title: "Buy 1 Get 1 Free on all Burgers",
        slug: "buy-1-get-1-free-burgers",
        price: 5000,
        image: "/images/seeder/offer/bogo-burger.png",
        status: true
      },
      { title: "New Kings Collection", slug: "new-kings-collection", image: "/images/seeder/offer/new_kings_collection.png" },
      { title: "Free Fiery Chicken", slug: "free-fiery-chicken", image: "/images/seeder/offer/free_fiery_chicken.png" },
      { title: "Free Apple Shake", slug: "free-apple-thik-shake", image: "/images/seeder/offer/free_apple_thik_shake.png" },
      { title: "Kings ₦5,000 Off", slug: "new-kings-collection-off", image: "/images/seeder/offer/new_kings_collection_off_$49.png" },
    ];
    for (const o of offersData) {
      const exists = await Offer.findOne({ slug: o.slug });
      if (!exists) await Offer.create(o);
    }

    // 8. Seed Banners
    const { default: Banner } = await import("@/models/Banner");
    const bannersData = [
      { image: "/images/seeder/slider/slider_one.png", title: "Flame Grilled Burgers", subtitle: "Cooked fresh, every single time", link: "/menu", order: 1 },
      { image: "/images/seeder/slider/slider_two.png", title: "Exclusive Deals Today", subtitle: "Save big on your favourite meals", link: "/menu", order: 2 },
      { image: "/images/seeder/slider/slider_three.png", title: "Order in Minutes", subtitle: "Fast delivery right to your door", link: "/menu", order: 3 },
    ];
    for (const b of bannersData) {
      const exists = await Banner.findOne({ title: b.title });
      if (!exists) await Banner.create(b);
    }

    return NextResponse.json({
      status: true,
      message: "Database seeded successfully with default Admin, Customer, Categories, Items, and Paystack Gateway!",
      adminCredentials: {
        email: "admin@example.com",
        password: "123456",
        role: "admin",
      },
      customerCredentials: {
        email: "customer@example.com",
        password: "123456",
        role: "customer",
      },
    });
  } catch (error: any) {
    console.error("Database Seed Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
