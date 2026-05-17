export function GET() {
  const key = process.env.INDEXNOW_KEY ?? "";
  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
