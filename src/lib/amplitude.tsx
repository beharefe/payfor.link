"use client";

import * as amplitude from "@amplitude/unified";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
  amplitude.initAll(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY, {
    serverZone: "EU",
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  });
}

export const Amplitude = () => null;
export default amplitude;
