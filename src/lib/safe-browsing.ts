/**
 * URL safety check — currently a no-op.
 * Always returns safe: true so product creation is never blocked by this check.
 */
export async function checkUrlSafe(
  _url: string,
): Promise<{ safe: boolean; error?: string }> {
  return { safe: true };
}
