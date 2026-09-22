"use client";

import { useEffect } from "react";

export default function MarketplaceViewTracker({ postingId }: { postingId: string }) {
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/marketplace/${postingId}/views`, {
      method: "POST",
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [postingId]);

  return null;
}
