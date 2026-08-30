const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const srcLogo = path.join(__dirname, "../public/images/theme/theme-favicon-logo.png");
const outDir = path.join(__dirname, "../public/images/icons");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const splashScreens = [
  { name: "splash-640x1136.png", width: 640, height: 1136 },
  { name: "splash-750x1334.png", width: 750, height: 1334 },
  { name: "splash-828x1792.png", width: 828, height: 1792 },
  { name: "splash-1125x2436.png", width: 1125, height: 2436 },
  { name: "splash-1242x2208.png", width: 1242, height: 2208 },
  { name: "splash-1242x2688.png", width: 1242, height: 2688 },
  { name: "splash-1536x2048.png", width: 1536, height: 2048 },
  { name: "splash-1668x2224.png", width: 1668, height: 2224 },
  { name: "splash-1668x2388.png", width: 1668, height: 2388 },
  { name: "splash-2048x2732.png", width: 2048, height: 2732 },
];

const icons = [
  { name: "icon-72x72.png", size: 72 },
  { name: "icon-96x96.png", size: 96 },
  { name: "icon-128x128.png", size: 128 },
  { name: "icon-144x144.png", size: 144 },
  { name: "icon-152x152.png", size: 152 },
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-384x384.png", size: 384 },
  { name: "icon-512x512.png", size: 512 },
];

async function generate() {
  console.log("Generating Splash Screens from:", srcLogo);

  for (const splash of splashScreens) {
    const logoWidth = Math.round(splash.width * 0.42); // 42% of screen width
    
    // Resize logo
    const resizedLogoBuffer = await sharp(srcLogo)
      .resize({ width: logoWidth, fit: "inside" })
      .toBuffer();

    // Create white canvas and composite logo in center
    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: resizedLogoBuffer, gravity: "centre" }])
      .png()
      .toFile(path.join(outDir, splash.name));

    console.log(`✅ Generated ${splash.name} (${splash.width}x${splash.height})`);
  }

  console.log("\nGenerating App Icons...");
  for (const icon of icons) {
    await sharp(srcLogo)
      .resize(icon.size, icon.size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(outDir, icon.name));

    console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
  }

  console.log("\n🎉 All splash screens and icons generated successfully!");
}

generate().catch(console.error);
