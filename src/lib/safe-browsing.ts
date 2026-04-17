import { JWT } from "google-auth-library";

const ENDPOINT = "https://webrisk.googleapis.com/v1/uris:search";
const THREAT_TYPES = ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"];
const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

// Lazy-init JWT client — reused across invocations in the same process.
let jwtClient: JWT | null = null;

function getClient(): JWT | null {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;
  if (!jwtClient) {
    const sa = JSON.parse(json) as { client_email: string; private_key: string };
    jwtClient = new JWT({ email: sa.client_email, key: sa.private_key, scopes: SCOPES });
  }
  return jwtClient;
}

export async function checkUrlSafe(
  url: string,
): Promise<{ safe: boolean; error?: string }> {
  const client = getClient();
  if (!client) return { safe: true };

  try {
    const tokenResponse = await client.authorize();
    const token = tokenResponse.access_token;
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
