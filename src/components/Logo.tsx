// 6304 Agent brand mark — a processor/chip with "6304" on the die.
// Fixed brand colors (indigo body, white die text + pins); pass `className`
// to size it. Used in every navbar, the login screen, and the footer.
export function ChipLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="6304 Agent"
    >
      <g fill="#2400D6">
        {/* top pins */}
        <rect x="13.2" y="5" width="2.4" height="6" rx="1.2" />
        <rect x="18" y="5" width="2.4" height="6" rx="1.2" />
        <rect x="22.8" y="5" width="2.4" height="6" rx="1.2" />
        <rect x="27.6" y="5" width="2.4" height="6" rx="1.2" />
        <rect x="32.4" y="5" width="2.4" height="6" rx="1.2" />
        {/* bottom pins */}
        <rect x="13.2" y="37" width="2.4" height="6" rx="1.2" />
        <rect x="18" y="37" width="2.4" height="6" rx="1.2" />
        <rect x="22.8" y="37" width="2.4" height="6" rx="1.2" />
        <rect x="27.6" y="37" width="2.4" height="6" rx="1.2" />
        <rect x="32.4" y="37" width="2.4" height="6" rx="1.2" />
        {/* left pins */}
        <rect x="5" y="13.8" width="6" height="2.4" rx="1.2" />
        <rect x="5" y="19.8" width="6" height="2.4" rx="1.2" />
        <rect x="5" y="25.8" width="6" height="2.4" rx="1.2" />
        <rect x="5" y="31.8" width="6" height="2.4" rx="1.2" />
        {/* right pins */}
        <rect x="37" y="13.8" width="6" height="2.4" rx="1.2" />
        <rect x="37" y="19.8" width="6" height="2.4" rx="1.2" />
        <rect x="37" y="25.8" width="6" height="2.4" rx="1.2" />
        <rect x="37" y="31.8" width="6" height="2.4" rx="1.2" />
      </g>
      <rect x="12" y="12" width="24" height="24" rx="2" fill="#2400D6" />
      <text
        x="24"
        y="24.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="8.5"
        fontWeight="800"
        fill="#ffffff"
        letterSpacing="-0.4"
      >
        6304
      </text>
    </svg>
  );
}
