"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";

interface MapComponentProps {
  initialLat?: number;
  initialLng?: number;
  addressText?: string;
  onLocationSelect: (lat: number, lng: number, address: string, isFromAutocomplete?: boolean) => void;
}

const MapGoogle = dynamic(() => import("./MapComponentGoogle"), { ssr: false });
const MapOSM = dynamic(() => import("./MapComponentOSM"), { ssr: false });

const LoadingPlaceholder = () => (
  <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm">
    Loading map...
  </div>
);

export default function MapComponent(props: MapComponentProps) {
  const [provider, setProvider] = useState<"google" | "openstreetmap" | null>(null);
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings/map-provider")
      .then((r) => r.json())
      .then((data) => {
        setProvider(data.provider || "openstreetmap");
        if (data.apiKey) setApiKey(data.apiKey);
      })
      .catch(() => setProvider("openstreetmap"));
  }, []);

  if (!provider) return <LoadingPlaceholder />;

  const effectiveKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const useGoogle = provider === "google" && effectiveKey && effectiveKey.length > 10;

  if (useGoogle) {
    return (
      <Suspense fallback={<LoadingPlaceholder />}>
        <MapGoogle {...props} apiKey={effectiveKey} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <MapOSM {...props} />
    </Suspense>
  );
}
