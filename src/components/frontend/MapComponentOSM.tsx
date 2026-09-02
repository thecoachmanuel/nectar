"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { LocateFixed, Search } from "lucide-react";
import { toast } from "sonner";

interface MapComponentOSMProps {
  initialLat?: number;
  initialLng?: number;
  addressText?: string;
  onLocationSelect: (lat: number, lng: number, address: string, isFromAutocomplete?: boolean) => void;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return "";
    const data = await res.json();
    return data.display_name || "";
  } catch {
    return "";
  }
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&countrycodes=ng`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

const DEFAULT_LAT = 6.5244;
const DEFAULT_LNG = 3.3792;

function LeafletMapInner({
  lat,
  lng,
  onMapClick,
  onMarkerDragEnd,
}: {
  lat: number;
  lng: number;
  onMapClick: (lat: number, lng: number) => void;
  onMarkerDragEnd: (lat: number, lng: number) => void;
}) {
  const [L, setL] = useState<any>(null);
  const [MapLib, setMapLib] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      // @ts-ignore
      import("leaflet"),
      // @ts-ignore
      import("react-leaflet"),
    ]).then(([leaflet, rl]) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setL(leaflet);
      setMapLib(rl);
    });
  }, []);

  if (!L || !MapLib) {
    return (
      <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm">
        Loading map...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, useMapEvents } = MapLib as any;

  const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  function ClickHandler() {
    useMapEvents({
      click(e: any) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ width: "100%", height: "300px", borderRadius: "0.75rem", zIndex: 0 }}
      key={`map-${lat.toFixed(5)}-${lng.toFixed(5)}`}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ClickHandler />
      <Marker
        position={[lat, lng]}
        draggable
        icon={icon}
        eventHandlers={{
          dragend(e: any) {
            const pos = e.target.getLatLng();
            onMarkerDragEnd(pos.lat, pos.lng);
          },
        }}
      />
    </MapContainer>
  );
}

export default function MapComponentOSM({
  initialLat,
  initialLng,
  addressText,
  onLocationSelect,
}: MapComponentOSMProps) {
  const [markerLat, setMarkerLat] = useState(initialLat || DEFAULT_LAT);
  const [markerLng, setMarkerLng] = useState(initialLng || DEFAULT_LNG);
  const [inputValue, setInputValue] = useState(addressText || "");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInputValue(addressText || ""); }, [addressText]);

  useEffect(() => {
    if (initialLat && initialLng) {
      setMarkerLat(initialLat);
      setMarkerLng(initialLng);
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (!initialLat && !initialLng) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await handleReverseGeocode(pos.coords.latitude, pos.coords.longitude);
          },
          () => {}
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setMarkerLat(lat);
    setMarkerLng(lng);
    const addr = await reverseGeocode(lat, lng);
    setInputValue(addr);
    onLocationSelect(lat, lng, addr);
  }, [onLocationSelect]);

  const handleSearchInput = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddress(val);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 600);
  };

  const handleSuggestionSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarkerLat(lat);
    setMarkerLng(lng);
    setInputValue(result.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect(lat, lng, result.display_name, true);
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported by your browser"); return; }
    toast.loading("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        toast.dismiss();
        toast.success("Location found");
        await handleReverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      () => { toast.dismiss(); toast.error("Unable to retrieve your location"); }
    );
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-sm border border-slate-200" ref={wrapperRef}>
      <div className="absolute top-3 left-3 right-3 z-[500] flex gap-2">
        <div className="flex-auto relative">
          <input
            type="text"
            placeholder="Search address..."
            value={inputValue}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-0 shadow-md rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ff006b]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          {isSearching && (
            <div className="absolute right-3 top-3 w-4 h-4 border-2 border-[#ff006b] border-t-transparent rounded-full animate-spin" />
          )}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[600] max-h-52 overflow-y-auto">
              {suggestions.map((s) => (
                <li
                  key={s.place_id}
                  className="px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-start gap-2"
                  onMouseDown={() => handleSuggestionSelect(s)}
                >
                  <span className="mt-0.5 shrink-0">📍</span>
                  <span className="line-clamp-2">{s.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); getUserLocation(); }}
          className="h-[40px] w-[40px] bg-white text-[#ff006b] rounded-xl shadow-md flex items-center justify-center hover:bg-[#fff5f9] transition-colors flex-shrink-0"
          title="Use my location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      <LeafletMapInner
        lat={markerLat}
        lng={markerLng}
        onMapClick={handleReverseGeocode}
        onMarkerDragEnd={handleReverseGeocode}
      />

      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur text-[10px] font-semibold text-slate-600 px-3 py-1.5 rounded-lg shadow-sm text-center z-[400] pointer-events-none">
        Drag the pin or click to adjust your exact location
      </div>
    </div>
  );
}
