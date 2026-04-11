import type { AnalyticsEvent } from "./amplitude";

/**
 * Fire-and-forget server-side event to Amplitude HTTP API v2.
 * Use this in server actions, API routes, and webhooks.
 * Never throws — analytics must never break the request.
 */
export async function trackServer(
  event: AnalyticsEvent,
  userId?: string,
): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return;
  try {
    await fetch("https://api2.amplitude.com/2/httpapi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        events: [
          {
            event_type: event.name,
            event_properties: "props" in event ? event.props : {},
            user_id: userId,
            time: Date.now(),
          },
        ],
      }),
    });
  } catch {
    // Non-blocking — never fail the request due to analytics
  }
}
