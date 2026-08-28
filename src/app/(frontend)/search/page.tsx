"use client";

import React, { Suspense } from "react";
import SearchContent from "./SearchContent";
import { Loader2 } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#ff006b" }} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
