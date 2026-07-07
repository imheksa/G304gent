"use client";

import { EngineIcon } from "./EngineIcon";

const ENGINES = ["ChatGPT", "Gemini", "Claude", "Grok", "Deepseek", "Google AI"];

// An infinite marquee of the monitored engines. Two identical halves scroll
// -50% for a seamless loop; pauses on hover.
export default function Marquee() {
  const half = [...ENGINES, ...ENGINES];
  const items = [...half, ...half]; // two halves → seamless -50%
  return (
    <section className="border-y border-white/5 bg-gray-950/60 py-5">
      <div className="marquee">
        <div className="marquee__track">
          {items.map((e, i) => (
            <span key={i} className="flex items-center gap-2.5 font-mono text-sm text-gray-500">
              <EngineIcon name={e} className="h-4 w-4 text-gray-400" />
              {e}
              <span className="text-cyan-500/50">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
