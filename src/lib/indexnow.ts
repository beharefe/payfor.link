const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
const KEY = process.env.INDEXNOW_KEY;

export async function pingIndexNow(urls: string[]): Promise<void> {
  if (!KEY || urls.length === 0) return;
  try {
    const host = new URL(APP_URL).hostname;
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: KEY,
        keyLocation: `${APP_URL}/api/indexnow-key.txt`,
        urlList: urls,
      }),
    });
  } catch {
    // Non-fatal — indexing is best-effort
  }
}
