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

      // Per-word stagger reveal. Applied to all headings + [data-stagger].
      // Gradient-safe: plain text is split into word spans, while nested
      // elements (e.g. a .text-gradient span) are wrapped and animated as one
      // unit so their styling stays intact.
      const splitStagger = (el: HTMLElement): HTMLElement[] => {
        if (el.dataset.staggered) return [];
        el.dataset.staggered = "1";
        const words: HTMLElement[] = [];
        const nodes = Array.from(el.childNodes);
        el.textContent = "";
        nodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            (node.textContent || "").split(/(\s+)/).forEach((tok) => {
              if (tok === "") return;
              if (/^\s+$/.test(tok)) {
                el.appendChild(document.createTextNode(tok));
                return;
              }
              const s = document.createElement("span");
              s.className = "stagger-word";
              s.textContent = tok;
              el.appendChild(s);
              words.push(s);
            });
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const elem = node as HTMLElement;
            if (elem.tagName === "BR") {
              el.appendChild(elem);
              return;
            }
            const s = document.createElement("span");
            s.className = "stagger-word";
            s.appendChild(elem);
            el.appendChild(s);
            words.push(s);
          } else {
            el.appendChild(node);
          }
        });
        return words;
      };

      document.querySelectorAll<HTMLElement>("h1, h2, [data-stagger]").forEach((el) => {
        const words = splitStagger(el);
        if (!words.length) return;
        const run = () =>
          words.forEach((s, i) => {
            s.style.transitionDelay = `${i * 0.045}s`;
            s.classList.add("in");
          });
        if (el.getBoundingClientRect().top < window.innerHeight) {
          requestAnimationFrame(() => requestAnimationFrame(run));
        } else {
          const so = new IntersectionObserver(
            (es) => es.forEach((e) => e.isIntersecting && (run(), so.disconnect())),
            { threshold: 0.3 }
          );
          so.observe(el);
          cleanups.push(() => so.disconnect());
        }
      });

      // Count-up for [data-countup] numeric elements.
      document.querySelectorAll<HTMLElement>("[data-countup]").forEach((el) => {
        const target = parseInt(el.textContent || "0", 10);
        if (!Number.isFinite(target)) return;
        const animate = () => {
          const dur = 1200;
          const start = performance.now();
          const step = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        };
        const co = new IntersectionObserver(
          (es) => es.forEach((e) => e.isIntersecting && (animate(), co.disconnect())),
          { threshold: 0.6 }
        );
        co.observe(el);
        cleanups.push(() => co.disconnect());
      });
    }

    // --- Custom cursor + magnetic (desktop, motion-safe) ---
    if (fine && !reduce) {
      const root = document.documentElement;
      root.classList.add("playful");

      const dot = document.createElement("div");
      dot.className = "cursor-dot";
      const ring = document.createElement("div");
      ring.className = "cursor-ring";
      const label = document.createElement("div");
      label.className = "cursor-text";
      document.body.append(dot, ring, label);

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
        const t = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        ring.style.transform = t;
        label.style.transform = t;
        raf = requestAnimationFrame(loop);
      };
      window.addEventListener("mousemove", onMove);
      loop();

      const interactive = "a, button, [data-magnetic], [role='button'], input, select, textarea";
      const over = (e: Event) => {
        const t = e.target as Element;
        if (t?.closest?.(interactive)) root.classList.add("cursor-hover");
        const c = t?.closest?.("[data-cursor]") as HTMLElement | null;
        if (c) {
          label.textContent = c.dataset.cursor || "";
          root.classList.add("cursor-labeled");
        }
      };
      const out = (e: Event) => {
        const t = e.target as Element;
        if (t?.closest?.(interactive)) root.classList.remove("cursor-hover");
        if (t?.closest?.("[data-cursor]")) root.classList.remove("cursor-labeled");
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

      // Mouse-parallax tilt
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        const move = (e: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = `perspective(1000px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg)`;
        };
        const leave = () => {
          el.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg)";
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
        label.remove();
        root.classList.remove("playful", "cursor-hover", "cursor-labeled");
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
