"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Buttery inertia scrolling (Lenis) for the landing page, with smooth anchor
// jumps. Disabled under prefers-reduced-motion; destroyed on unmount so app
// pages keep native scrolling.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Smooth in-page anchor navigation (#features, #pricing, …).
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const href = a?.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -64 });
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return null;
}
