"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSettingsStore, getHeaderLogo, getFooterLogo } from "@/store/useSettingsStore";

interface BrandLogoProps {
  variant?: "header" | "footer" | "admin";
  href?: string;
  className?: string;
  imageClassName?: string;
  alt?: string;
}

export default function BrandLogo({
  variant = "header",
  href = variant === "admin" ? "/admin/dashboard" : "/",
  className = "",
  imageClassName = "",
  alt = "Errandshop",
}: BrandLogoProps) {
  const { settings } = useSettingsStore();

  // Determine current logo source based on variant
  const currentLogoUrl =
    variant === "footer"
      ? getFooterLogo(settings)
      : getHeaderLogo(settings);

  const [imgSrc, setImgSrc] = useState<string>(currentLogoUrl);
  const [hasError, setHasError] = useState(false);

  // Keep in sync when settings change
  useEffect(() => {
    if (currentLogoUrl) {
      setImgSrc(currentLogoUrl);
      setHasError(false);
    }
  }, [currentLogoUrl]);

  // Default dimensions and styling based on variant
  let defaultContainerClass = "flex items-center shrink-0 transition-opacity duration-200";
  let defaultImgClass = "h-auto object-contain max-h-full";
  let defaultFallbackImg =
    variant === "footer"
      ? "/images/theme/theme-footer-logo.png"
      : "/images/theme/theme-logo.png?v=2";

  if (variant === "header") {
    defaultContainerClass += " w-24 sm:w-32 h-9 sm:h-10";
    defaultImgClass += " w-24 sm:w-32 max-h-10";
  } else if (variant === "footer") {
    defaultContainerClass += " mb-8 w-32 sm:w-40 h-10 sm:h-12";
    defaultImgClass += " w-32 sm:w-40 max-h-12";
  } else if (variant === "admin") {
    defaultContainerClass += " h-8 w-auto";
    defaultImgClass += " h-8 w-auto";
  }

  const handleError = () => {
    if (!hasError && imgSrc !== defaultFallbackImg) {
      // Fallback to static asset if MongoDB uploaded image fails to load
      setImgSrc(defaultFallbackImg);
      setHasError(true);
    } else {
      // Both failed, render text fallback
      setHasError(true);
    }
  };

  const content = (
    <div className={`${defaultContainerClass} ${className}`}>
      {!hasError ? (
        <img
          src={imgSrc}
          alt={alt}
          loading="eager"
          onError={handleError}
          className={`${defaultImgClass} ${imageClassName}`}
        />
      ) : (
        <span
          className={`text-2xl font-black tracking-tight ${
            variant === "footer" ? "text-white" : ""
          }`}
          style={variant !== "footer" ? { color: "var(--primary-hex)" } : undefined}
        >
          {settings?.site_title || settings?.company_name || alt}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
