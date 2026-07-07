"use client";

import { useEffect } from "react";

// A lightweight "playful" interaction layer for the landing page:
//  - a custom glowing cursor (dot + lagging ring) that grows over interactive
//    elements,
//  - magnetic elements ([data-magnetic]) that lean toward the cursor,
//  - scroll-reveal for below-the-fold <section>s.
// Everything is gated to fine pointers and respects prefers-reduced-motion, and
// fully cleans up on unmount. No dependencies.
export default function PlayfulLayer() {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    // --- Scroll reveal (only sections that start below the fold, to avoid a
    // flash of hidden content) ---
    if (!reduce) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      document.querySelectorAll("section").forEach((s) => {
        if (s.getBoundingClientRect().top > window.innerHeight * 0.9) {
          s.setAttribute("data-reveal", "");
          io.observe(s);
        }
      });
      cleanups.push(() => io.disconnect());
    }

    // --- Custom cursor + magnetic (desktop, motion-safe) ---
    if (fine && !reduce) {
      const root = document.documentElement;
      root.classList.add("playful");

      const dot = document.createElement("div");
      dot.className = "cursor-dot";
      const ring = document.createElement("div");
      ring.className = "cursor-ring";
      document.body.append(dot, ring);

      let mx = window.innerWidth / 2;
      let my = window.innerHeight / 2;
      let rx = mx;
      let ry = my;

      const onMove = (e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      };
      let raf = 0;
      const loop = () => {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        raf = requestAnimationFrame(loop);
      };
      window.addEventListener("mousemove", onMove);
      loop();

      const interactive = "a, button, [data-magnetic], [role='button'], input, select, textarea";
      const over = (e: Event) => {
        if ((e.target as Element)?.closest?.(interactive)) root.classList.add("cursor-hover");
      };
      const out = (e: Event) => {
        if ((e.target as Element)?.closest?.(interactive)) root.classList.remove("cursor-hover");
      };
      document.addEventListener("mouseover", over);
      document.addEventListener("mouseout", out);

      // Magnetic pull
      const magHandlers: Array<() => void> = [];
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.4}px)`;
        };
        const leave = () => {
          el.style.transform = "";
        };
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        magHandlers.push(() => {
          el.removeEventListener("mousemove", move);
          el.removeEventListener("mouseleave", leave);
          el.style.transform = "";
        });
      });

      cleanups.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseover", over);
        document.removeEventListener("mouseout", out);
        magHandlers.forEach((fn) => fn());
        dot.remove();
        ring.remove();
        root.classList.remove("playful", "cursor-hover");
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
