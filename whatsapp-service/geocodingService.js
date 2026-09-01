// ─── Geocoding & Address Validation Service ─────────────────────────────────
// Validates text addresses, converts to GPS coordinates via Google Maps API, or enforces completeness

async function getGoogleMapsApiKey(db) {
  if (process.env.GOOGLE_MAPS_API_KEY) return process.env.GOOGLE_MAPS_API_KEY;
  if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.includes("your_google_maps")) {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }

  try {
    const settingsCollection = db.collection("settings");
    const setting = await settingsCollection.findOne({
      key: { $in: ["google_maps_api_key", "google_map_key", "site_google_map_key", "map_api_key"] }
    });
    if (setting && setting.payload && typeof setting.payload === "string") {
      return setting.payload.trim();
    }
  } catch (e) {
    // Non-fatal
  }

  return null;
}

async function geocodeAddress(db, addressText) {
  const clean = String(addressText || "").trim();
  if (!clean || clean.length < 5) {
    return {
      success: false,
      reason: "too_short",
      message: "Address is too short. Please provide a street name and house number.",
    };
  }

  // 1. Check if user typed a single generic word (e.g. "Lekki", "Abuja", "Lagos", "Home", "Gate")
  const wordCount = clean.split(/\s+/).length;
  const commonGenericWords = ["LEKKI", "VI", "ABUJA", "LAGOS", "IKEJA", "HOME", "MY HOUSE", "GATE", "OFFICE", "SHOP"];
  if (wordCount === 1 || commonGenericWords.includes(clean.toUpperCase())) {
    return {
      success: false,
      reason: "too_vague",
      message: "Please include your House Number, Street Name, and Nearest Landmark (or share your Location Pin).",
    };
  }

  // 2. Try Google Geocoding API if key is available
  const apiKey = await getGoogleMapsApiKey(db);
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(clean)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const lat = result.geometry?.location?.lat;
        const lng = result.geometry?.location?.lng;
        const formatted = result.formatted_address || clean;

        if (lat !== undefined && lng !== undefined) {
          console.log(`📍 Geocoded "${clean}" ➔ (${lat}, ${lng}) - ${formatted}`);
          return {
            success: true,
            latitude: lat,
            longitude: lng,
            formattedAddress: formatted,
          };
        }
      }
    } catch (apiErr) {
      console.warn("⚠️ Google Geocoding request failed:", apiErr.message);
    }
  }

  // 3. Fallback heuristic validation: Accept any address with at least 4 characters
  if (clean.length >= 4) {
    return {
      success: true,
      latitude: undefined,
      longitude: undefined,
      formattedAddress: clean,
    };
  }

  return {
    success: false,
    reason: "needs_detail",
    message: "Please provide a complete delivery address with Street Name, Area, and Landmark (or share your Location Pin).",
  };
}

module.exports = {
  geocodeAddress,
  getGoogleMapsApiKey,
};
