"use client";

import { usePrivy } from "@privy-io/react-auth";

// A primary call-to-action that opens the Privy login ("Continue with Google")
// when the user is signed out, and links to the app (with optional different
// label/target) when signed in.
export default function PrimaryCTA({
  href,
  className,
  children,
  authedHref,
  authedChildren,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  authedHref?: string;
  authedChildren?: React.ReactNode;
}) {
  const { ready, authenticated, login } = usePrivy();

  if (ready && authenticated) {
    return (
      <a href={authedHref ?? href} className={className}>
        {authedChildren ?? children}
      </a>
    );
  }

  return (
    <button onClick={() => login()} className={className}>
      {children}
    </button>
  );
}
