// Minimal, professional monochrome marks for each AI engine (uses currentColor).
export function EngineIcon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const common = { viewBox: "0 0 24 24", className, xmlns: "http://www.w3.org/2000/svg" };
  switch (name) {
    case "Gemini":
      // Four-point spark
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2c.5 5 1.5 6 6.5 6.5-5 .5-6 1.5-6.5 6.5-.5-5-1.5-6-6.5-6.5 5-.5 6-1.5 6.5-6.5z" />
        </svg>
      );
    case "Claude":
      // Eight-ray asterisk
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
        </svg>
      );
    case "Grok":
      // Bold X (xAI)
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      );
    case "Deepseek":
      // Concentric "deep" rings
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="3.4" />
        </svg>
      );
    case "Google AI":
      // Open ring, Google-G style
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
          <path d="M20 12a8 8 0 10-2.6 5.9" />
          <path d="M20.5 12H13" />
        </svg>
      );
    case "ChatGPT":
    default:
      // Hex node (neural)
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M12 3l7.5 4.3v8.6L12 20.2 4.5 15.9V7.3L12 3z" />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
