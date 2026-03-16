import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Publishable key (sb_publishable_...) or legacy anon JWT — RLS applies. */
const getPublishableKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Secret key (sb_secret_...) or legacy service_role JWT — bypasses RLS. Server-only. */
const getSecretKey = () =>
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Authenticated client — respects RLS, reads session from cookies. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getPublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — cookie writes are no-ops.
          }
        },
      },
    },
  );
}

/** Service role client — bypasses RLS. Use only server-side for privileged ops
 *  (webhook handler, unlock tokens). Never expose to the browser. */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSecretKey(),
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}
