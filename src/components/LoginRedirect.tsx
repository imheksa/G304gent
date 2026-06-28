"use client";

import { useLogin } from "@privy-io/react-auth";

// Mounted once globally. After a fresh login completes, send the user straight
// to their dashboard (not back to the homepage).
export default function LoginRedirect() {
  useLogin({
    onComplete: ({ wasAlreadyAuthenticated }) => {
      if (!wasAlreadyAuthenticated) {
        window.location.href = "/dashboard";
      }
    },
  });
  return null;
}
