import { GoogleAuth } from "google-auth-library";

const ENDPOINT = "https://webrisk.googleapis.com/v1/uris:search";
const THREAT_TYPES = ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"];
const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

// Lazy-init auth client — reused across invocations in the same process.
let auth: GoogleAuth | null = null;

function getAuth(): GoogleAuth | null {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;
  if (!auth) {
    auth = new GoogleAuth({
      credentials: JSON.parse(json),
      scopes: SCOPES,
    });
  }
  return auth;
}

export async function checkUrlSafe(
  url: string,
): Promise<{ safe: boolean; error?: string }> {
  const authClient = getAuth();
  if (!authClient) return { safe: true };

  try {
    const token = await authClient.getAccessToken();
    if (!token) return { safe: true, error: "Could not obtain access token" };

    const params = new URLSearchParams({ uri: url.trim() });
    for (const t of THREAT_TYPES) params.append("threatTypes", t);

    const res = await fetch(`${ENDPOINT}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return { safe: true, error: `Web Risk API error: ${res.status}` };
    }

    const data = (await res.json()) as { threat?: { threatTypes: string[] } };
    return { safe: !data.threat };
  } catch (err) {
    return {
      safe: true,
      error: err instanceof Error ? err.message : "Web Risk check failed",
    };
  }
}
