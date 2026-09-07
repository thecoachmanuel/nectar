"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";
import { getHeaderLogo, getFooterLogo } from "@/store/useSettingsStore";

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
  const { headerLogo, footerLogo, settings } = useSettings();

  // Determine current logo source based on variant
  const currentLogoUrl =
    variant === "footer"
      ? (footerLogo || getFooterLogo(settings))
      : (headerLogo || getHeaderLogo(settings));

  const defaultFallbackImg =
    variant === "footer"
      ? "/images/theme/theme-footer-logo.png"
      : "/images/theme/theme-logo.png?v=2";

  // Track if currentLogoUrl failed to load in browser
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const isFailed = failedUrl === currentLogoUrl;
  const isDefaultFailed = failedUrl === defaultFallbackImg;
  const displaySrc = isFailed ? defaultFallbackImg : (currentLogoUrl || defaultFallbackImg);
  const showTextFallback = isDefaultFailed || (isFailed && !defaultFallbackImg);

  // Default dimensions and styling based on variant
  let defaultContainerClass = "flex items-center shrink-0";
  let defaultImgClass = "h-auto object-contain max-h-full";

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
    if (!failedUrl) {
      setFailedUrl(currentLogoUrl);
    } else {
      setFailedUrl(defaultFallbackImg);
    }
  };

  const content = (
    <div className={`${defaultContainerClass} ${className}`}>
      {!showTextFallback ? (
        <img
          src={displaySrc}
          alt={alt}
          loading="eager"
          decoding="sync"
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

