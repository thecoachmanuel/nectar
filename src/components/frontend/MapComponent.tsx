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
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

export default function MapComponent({ initialLat, initialLng, onLocationSelect }: MapComponentProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [center, setCenter] = useState({ lat: initialLat || defaultCenter.lat, lng: initialLng || defaultCenter.lng });
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const reverseGeocode = (lat: number, lng: number) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        onLocationSelect(lat, lng, results[0].formatted_address);
      } else {
        onLocationSelect(lat, lng, "");
      }
    });
  };

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
        if (place.formatted_address) {
          onLocationSelect(lat, lng, place.formatted_address);
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

  if (loadError) return <div className="p-4 bg-red-50 text-red-500 rounded-xl text-sm">Error loading maps. Check API key.</div>;
  if (!isLoaded) return <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm">Loading map...</div>;

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <div className="absolute top-3 left-3 right-3 z-10 flex gap-2">
        <div className="flex-auto relative">
          <Autocomplete
            onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              type="text"
              placeholder="Search places..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-0 shadow-md rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ff006b]"
            />
          </Autocomplete>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); getUserLocation(); }}
          className="h-[40px] w-[40px] bg-white text-[#ff006b] rounded-xl shadow-md flex items-center justify-center hover:bg-[#fff5f9] transition-colors"
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
