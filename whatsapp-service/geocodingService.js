// ─── Geocoding & Address Validation Service ─────────────────────────────────
// Converts text addresses to accurate GPS coordinates via Google Maps API,
// OpenStreetMap Nominatim, and curated Nigerian neighborhood dictionary.

const NEIGHBORHOOD_COORDINATES = [
  // Lagos Islands & Peninsula
  { keys: ["LEKKI PHASE 1", "LEKKI 1", "ADMIRALTY"], lat: 6.4474, lng: 3.4730, name: "Lekki Phase 1, Lagos" },
  { keys: ["LEKKI", "CHEVRON", "AGUNGI", "IKATE", "JAKANDE", "OSAPA"], lat: 6.4498, lng: 3.5152, name: "Lekki, Lagos" },
  { keys: ["VICTORIA ISLAND", " VI ", "VI,", "OZUMBA", "ADEYEMO", "AHMADU BELLO", "KOFO ABAYOMI", "V/I"], lat: 6.4281, lng: 3.4219, name: "Victoria Island, Lagos" },
  { keys: ["IKOYI", "BANANA ISLAND", "BOURDILLON", "GLOVER", "PARKVIEW", "OLD IKOYI"], lat: 6.4549, lng: 3.4346, name: "Ikoyi, Lagos" },
  { keys: ["AJAH", "SANGOTEDO", "VGC", "VICTORIA GARDEN CITY", "ABRAHAM ADESANYA", "BADORE"], lat: 6.4684, lng: 3.5670, name: "Ajah, Lagos" },
  { keys: ["ONIRU", "PALMS"], lat: 6.4350, lng: 3.4410, name: "Oniru, Victoria Island, Lagos" },
  
  // Lagos Mainland
  { keys: ["IKEJA", "GRA IKEJA", "IKEJA GRA", "ALLEN", "ODUDUWA", "OPEBI", "ALAWUSA", "MOBOLAJI BANK ANTHONY"], lat: 6.5960, lng: 3.3431, name: "Ikeja, Lagos" },
  { keys: ["SURULERE", "BODE THOMAS", "ADENIRAN OGUNSANYA", "OGUNLANA", "NATIONAL STADIUM"], lat: 6.4969, lng: 3.3562, name: "Surulere, Lagos" },
  { keys: ["YABA", "UNILAG", "AKOKA", "SABO", "HERBERT MACAULAY", "TEJUOSHO", "ALAGOMEJI"], lat: 6.5095, lng: 3.3711, name: "Yaba, Lagos" },
  { keys: ["MARYLAND", "MENDE", "ANTHONY", "ANTHONY VILLAGE"], lat: 6.5684, lng: 3.3686, name: "Maryland, Lagos" },
  { keys: ["MAGODO", "MAGODO PHASE 2", "MAGODO PHASE 1", "SHANGISHA", "ISHERI"], lat: 6.6210, lng: 3.3850, name: "Magodo, Lagos" },
  { keys: ["GBAGADA", "SOLUYI", "MEDINA", "CHARLY BOY"], lat: 6.5540, lng: 3.3888, name: "Gbagada, Lagos" },
  { keys: ["OGBA", "IFAIYE", "OJODU", "OJODU BERGER", "BERGER"], lat: 6.6341, lng: 3.3364, name: "Ogba/Ojodu, Lagos" },
  { keys: ["FESTAC", "FESTAC TOWN", "AMUWO ODOFIN", "AMUWO", "MILE 2"], lat: 6.4633, lng: 3.2844, name: "Festac Town, Lagos" },
  { keys: ["ILUPEJU", "TOWN PLANNING", "PALMGROVE", "ONIPANU"], lat: 6.5490, lng: 3.3630, name: "Ilupeju, Lagos" },
  { keys: ["AGEGE", "DOPEMU", "PEN CINEMA", "ABULE EGBA", "IJAW"], lat: 6.6180, lng: 3.3210, name: "Agege, Lagos" },

  // Abuja FCT
  { keys: ["WUSE 2", "WUSE II", "AMINU KANO", "ADETOKUNBO ADEMOLA", "WUSE"], lat: 9.0765, lng: 7.4723, name: "Wuse 2, Abuja" },
  { keys: ["GARKI", "GARKI 2", "GARKI AREA", "AREA 1", "AREA 2", "AREA 3", "AREA 8", "AREA 10", "AREA 11"], lat: 9.0339, lng: 7.4891, name: "Garki, Abuja" },
  { keys: ["MAITAMA", "AGUIYI IRONSI", "TRANSCORP"], lat: 9.0882, lng: 7.4934, name: "Maitama, Abuja" },
  { keys: ["JABI", "JABI LAKE", "JABI MALL"], lat: 9.0716, lng: 7.4262, name: "Jabi, Abuja" },
  { keys: ["UTAKO", "CHISCO", "OBAFEMI AWOLOWO"], lat: 9.0664, lng: 7.4428, name: "Utako, Abuja" },
  { keys: ["ASOKORO", "YAKUBU GOWON", "ECOWAS"], lat: 9.0436, lng: 7.5257, name: "Asokoro, Abuja" },
  { keys: ["CBD", "CENTRAL BUSINESS DISTRICT", "CENTRAL AREA"], lat: 9.0579, lng: 7.4951, name: "Central Area, Abuja" },
  { keys: ["GUZAIPE", "LOKOGOMA", "APO", "APO LEGISLATIVE", "KUBWA", "LUGBE"], lat: 9.0020, lng: 7.5120, name: "Abuja Extended Area" },
];

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
  } catch (e) {}

  return null;
}

async function geocodeAddress(db, addressText) {
  const clean = String(addressText || "").trim();
  if (!clean || clean.length < 3) {
    return {
      success: false,
      reason: "too_short",
      message: "Please enter your street name and house number.",
    };
  }

  const upperText = " " + clean.toUpperCase().replace(/[,\.-]/g, " ") + " ";

  // Strategy 1: Google Maps Geocoding API (with country component restriction)
  const apiKey = await getGoogleMapsApiKey(db);
  if (apiKey) {
    try {
      const queryWithCountry = clean.toLowerCase().includes("nigeria") ? clean : `${clean}, Nigeria`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryWithCountry)}&components=country:NG&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const lat = result.geometry?.location?.lat;
        const lng = result.geometry?.location?.lng;
        const formatted = result.formatted_address || clean;

        if (lat !== undefined && lng !== undefined) {
          console.log(`📍 [Google Geocode] "${clean}" ➔ (${lat}, ${lng}) - ${formatted}`);
          return {
            success: true,
            latitude: lat,
            longitude: lng,
            formattedAddress: formatted,
          };
        }
      }
    } catch (apiErr) {
      console.warn("⚠️ Google Geocoding request error:", apiErr.message);
    }
  }

  // Strategy 2: Fast Curated Neighborhood & Landmark Matcher
  for (const n of NEIGHBORHOOD_COORDINATES) {
    for (const key of n.keys) {
      if (upperText.includes(key.toUpperCase())) {
        console.log(`📍 [Neighborhood Match] Found "${key}" in "${clean}" ➔ (${n.lat}, ${n.lng})`);
        return {
          success: true,
          latitude: n.lat,
          longitude: n.lng,
          formattedAddress: clean,
        };
      }
    }
  }

  // Strategy 3: Free OpenStreetMap / Nominatim Geocoder
  try {
    const query = encodeURIComponent(`${clean}, Nigeria`);
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=ng`;
    const res = await fetch(osmUrl, {
      headers: { "User-Agent": "NectarGroceriesBot/1.0" },
    });
    const osmData = await res.json();

    if (Array.isArray(osmData) && osmData.length > 0) {
      const lat = parseFloat(osmData[0].lat);
      const lng = parseFloat(osmData[0].lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log(`📍 [OSM Nominatim Geocode] "${clean}" ➔ (${lat}, ${lng})`);
        return {
          success: true,
          latitude: lat,
          longitude: lng,
          formattedAddress: clean,
        };
      }
    }
  } catch (osmErr) {
    // Non-fatal
  }

  // Strategy 4: Fallback acceptance (Accepts clean text address with default proximity)
  return {
    success: true,
    latitude: undefined,
    longitude: undefined,
    formattedAddress: clean,
  };
}

module.exports = {
  geocodeAddress,
  getGoogleMapsApiKey,
};
