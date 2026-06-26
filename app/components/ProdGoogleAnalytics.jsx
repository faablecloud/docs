"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";

// Loads Google Analytics only on the production host, so localhost and the
// *.faable.link preview/origin deploys don't pollute production analytics.
export function ProdGoogleAnalytics({ gaId }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    if (host === "faable.com" || host === "www.faable.com") {
      setEnabled(true);
    }
  }, []);

  return enabled ? <GoogleAnalytics gaId={gaId} /> : null;
}
