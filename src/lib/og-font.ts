// Shared DM Sans font loader for next/og (Satori) route handlers.
//
// Satori supports WOFF/TTF/OTF but not WOFF2.
// Google Fonts returns WOFF2 for modern browsers, WOFF for older ones.
// We use an old Safari UA to get the WOFF URL from Google's CSS API.
//
// Module-level caching means the font is fetched at most once per
// function instance (one cold start), then reused across requests.

let _cache: { medium: ArrayBuffer; bold: ArrayBuffer; italic: ArrayBuffer } | null = null;

const SAFARI_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9";

async function fetchGoogleFontWoff(
  family: string,
  weight: number,
  italic = false,
): Promise<ArrayBuffer> {
  // Satori supports WOFF but not WOFF2 — old Safari UA makes Google return WOFF
  // Italic variant uses a different axis descriptor: ital,wght@1,{weight}
  const variant = italic
    ? `ital,wght@1,${weight}`
    : `wght@${weight}`;
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${variant}&display=swap`,
    { headers: { "User-Agent": SAFARI_UA } },
  ).then((r) => r.text());

  const fontUrl = css.match(/src: url\((.+?)\)/)?.[1];
  if (!fontUrl) throw new Error(`og-font: failed to parse CSS for ${family} ${weight} italic=${italic}`);
  return fetch(fontUrl).then((r) => r.arrayBuffer());
}

export async function getDMSansFonts(): Promise<{
  medium: ArrayBuffer;
  bold: ArrayBuffer;
  italic: ArrayBuffer;
}> {
  if (_cache) return _cache;
  const [medium, bold, italic] = await Promise.all([
    fetchGoogleFontWoff("DM Sans", 500),
    fetchGoogleFontWoff("DM Sans", 700),
    fetchGoogleFontWoff("DM Sans", 400, true),
  ]);
  _cache = { medium, bold, italic };
  return _cache;
}
