import { createClient } from "@unseallink/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailForm, OtpForm } from "./auth-forms";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "That link is invalid or has expired.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; email?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const sent = params.sent === "1";
  const email = params.email ? decodeURIComponent(params.email) : "";
  const rawError = params.error ? decodeURIComponent(params.error) : null;
  const error = rawError ? (ERROR_MESSAGES[rawError] ?? rawError) : null;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 hover:text-foreground transition-colors no-underline block">
            unseal.link
          </Link>
          <h1 className="text-3xl font-medium tracking-tight text-foreground mb-2">
            {sent ? "Check your email" : "Sign in"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {sent ? (
              <>
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </>
            ) : (
              "Seller sign-in. Enter your email and we'll send you a code."
            )}
          </p>
          {!sent && (
            <p className="text-xs text-muted-foreground mt-2">
              Looking for something you bought?{" "}
              <a
                href="/orders"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Access your orders
              </a>
            </p>
          )}
        </div>

        {sent ? (
          <OtpForm email={email} resendEmail={email} error={error} />
        ) : (
          <EmailForm defaultEmail={email} error={error} />
        )}
      </div>
    </main>
  );
}
