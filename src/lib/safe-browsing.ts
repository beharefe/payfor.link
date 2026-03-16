const API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
const ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";

export async function checkUrlSafe(url: string): Promise<{ safe: boolean; error?: string }> {
  if (!API_KEY) return { safe: true };

  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "payfor-link", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: url.trim() }],
        },
      }),
    });

    if (!res.ok) {
      return { safe: true, error: `Safe Browsing API error: ${res.status}` };
    }

    const data = (await res.json()) as { matches?: unknown[] };
    return { safe: !data.matches || data.matches.length === 0 };
  } catch (err) {
    return { safe: true, error: err instanceof Error ? err.message : "Safe Browsing check failed" };
  }
}
