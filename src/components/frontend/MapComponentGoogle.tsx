"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, useLoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import { LocateFixed, Search } from "lucide-react";
import { toast } from "sonner";

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];
const mapContainerStyle = { width: "100%", height: "300px", borderRadius: "0.75rem" };
const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York fallback

interface MapComponentProps {
  initialLat?: number;
  initialLng?: number;
  addressText?: string;
  apiKey?: string;
  onLocationSelect: (lat: number, lng: number, address: string, isFromAutocomplete?: boolean) => void;
}

import MapComponentOSM from "./MapComponentOSM";

export default function MapComponentGoogle({ initialLat, initialLng, addressText, apiKey, onLocationSelect }: MapComponentProps) {
  const effectiveKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: effectiveKey,
    libraries,
  });

  const [center, setCenter] = useState({ lat: initialLat || defaultCenter.lat, lng: initialLng || defaultCenter.lng });
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  const [inputValue, setInputValue] = useState(addressText || "");

  useEffect(() => {
    setInputValue(addressText || "");
  }, [addressText]);

  // Recenter and reset marker when initialLat/initialLng change (store edit)
  useEffect(() => {
    if (initialLat && initialLng) {
      const newPos = { lat: initialLat, lng: initialLng };
      setCenter(newPos);
      setMarker(newPos);
      mapRef.current?.panTo(newPos);
      mapRef.current?.setZoom(15);
    }
  }, [initialLat, initialLng]);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    let addressFound = "";

    // 1. Try Google Maps Geocoder if available
    if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await new Promise<{ results: google.maps.GeocoderResult[] | null; status: google.maps.GeocoderStatus }>((resolve) => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            resolve({ results, status });
          });
        });
        if (response.status === "OK" && response.results && response.results[0]) {
          addressFound = response.results[0].formatted_address;
        }
      } catch (e) {
        console.warn("Google Geocoding error, falling back to OSM:", e);
      }
    }

    // 2. Fallback to OpenStreetMap reverse geocoding if Google Geocoding is blocked/disabled/empty
    if (!addressFound) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.display_name) {
            addressFound = data.display_name;
          }
        }
      } catch (e) {
        console.warn("OSM reverse geocoding fallback failed:", e);
      }
    }

    if (addressFound) {
      setInputValue(addressFound);
      onLocationSelect(lat, lng, addressFound);
    } else {
      onLocationSelect(lat, lng, "");
    }
  }, [onLocationSelect]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      toast.loading("Finding your location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.dismiss();
          const { latitude, longitude } = position.coords;
          const newPos = { lat: latitude, lng: longitude };
          setCenter(newPos);
          setMarker(newPos);
          reverseGeocode(latitude, longitude);
          mapRef.current?.panTo(newPos);
          mapRef.current?.setZoom(16);
          toast.success("Location found");
        },
        () => {
          toast.dismiss();
          toast.error("Unable to retrieve your location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPos = { lat, lng };
        setCenter(newPos);
        setMarker(newPos);
        mapRef.current?.panTo(newPos);
        mapRef.current?.setZoom(16);
        const resolvedAddress = place.formatted_address || place.name || "";
        if (resolvedAddress) {
          setInputValue(resolvedAddress);
          onLocationSelect(lat, lng, resolvedAddress, true);
        }
      }
    }
  };

  // Run initial geolocation if no initial lat/lng provided
  useEffect(() => {
    if (!initialLat && !initialLng && isLoaded) {
      getUserLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (loadError) {
    // Seamlessly fallback to OSM map if Google fails to load
    return <MapComponentOSM initialLat={initialLat} initialLng={initialLng} addressText={addressText} onLocationSelect={onLocationSelect} />;
  }

  if (!isLoaded) return <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm">Loading map...</div>;

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
        <div className="flex-auto relative">
          <Autocomplete
            onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
            onPlaceChanged={onPlaceChanged}
            options={{ componentRestrictions: { country: "ng" } }}
          >
            <input
              type="text"
              placeholder="Search places..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border-0 shadow-md rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ff006b]"
            />
          </Autocomplete>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); getUserLocation(); }}
          className="h-[40px] w-[40px] bg-white text-primary rounded-xl shadow-md flex items-center justify-center hover:bg-[#fff5f9] transition-colors"
          title="Use my location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={center}
        onClick={handleMapClick}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {marker && (
          <Marker
            position={marker}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            animation={window.google.maps.Animation.DROP}
          />
        )}
      </GoogleMap>
      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur text-[10px] font-semibold text-slate-600 px-3 py-1.5 rounded-lg shadow-sm text-center">
        Drag the pin to adjust your exact location
      </div>
    </div>
  );
}
