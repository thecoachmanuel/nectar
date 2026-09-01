"use client";

import { useEffect } from "react";

/**
 * Enables smooth horizontal scrolling when users roll their mouse wheel
 * over any horizontal product slider, category carousel, or horizontal list.
 */
export default function HorizontalMouseScroll() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Ignore if user is holding Shift or Ctrl/Cmd (e.g. zooming)
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;

      // Only convert vertical scroll (deltaY) to horizontal scroll
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || Math.abs(e.deltaY) < 1) return;

      let el = e.target as HTMLElement | null;

      while (el && el !== document.body && el !== document.documentElement) {
        // Check if element has horizontal overflow
        const hasHorizontalOverflow = el.scrollWidth > el.clientWidth + 5;
        
        if (hasHorizontalOverflow) {
          const style = window.getComputedStyle(el);
          const isScrollableX =
            style.overflowX === "auto" ||
            style.overflowX === "scroll" ||
            el.classList.contains("overflow-x-auto") ||
            el.classList.contains("overflow-x-scroll") ||
            el.classList.contains("menu-slides") ||
            el.classList.contains("scrollbar-none") ||
            el.hasAttribute("data-horizontal-scroll");

          // Ensure it's not a primarily vertical container
          const hasVerticalOverflow = el.scrollHeight > el.clientHeight + 10;
          const isScrollableY = (style.overflowY === "auto" || style.overflowY === "scroll") && hasVerticalOverflow;

          if (isScrollableX && !isScrollableY) {
            const isAtStart = el.scrollLeft <= 1;
            const isAtEnd = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth - 2;

            // If we can scroll in the requested direction, prevent default page jump and scroll horizontally
            const canScrollLeft = e.deltaY < 0 && !isAtStart;
            const canScrollRight = e.deltaY > 0 && !isAtEnd;

            if (canScrollLeft || canScrollRight) {
              e.preventDefault();
              
              // Scroll horizontally with natural delta
              el.scrollLeft += e.deltaY;
              return;
            }
          }
        }

        el = el.parentElement;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
}
