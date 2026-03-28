import { signInWithOtp, verifySellerOtp } from "@unseallink/app/actions/auth";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "That link is invalid or has expired.",
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; email?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const email = params.email ? decodeURIComponent(params.email) : "";
  const rawError = params.error ? decodeURIComponent(params.error) : null;
  const error = rawError ? (ERROR_MESSAGES[rawError] ?? rawError) : null;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
            unseal.link
          </p>
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
              <a href="/orders" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Access your orders →
              </a>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {sent ? (
          <>
            <form action={verifySellerOtp} className="flex flex-col gap-4">
              <input type="hidden" name="email" value={email} />
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Verification code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring tracking-[0.4em] text-center font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground border-none rounded-full font-medium text-sm cursor-pointer hover:opacity-90 transition-opacity"
              >
                Verify code →
              </button>
            </form>

            {/* Resend + change email */}
            <div className="mt-5 flex flex-col gap-2 items-center">
              <form action={signInWithOtp}>
                <input type="hidden" name="email" value={email} />
                <button
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  Resend code
                </button>
              </form>
              <a
                href="/auth"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
              >
                Use a different email
              </a>
            </div>
          </>
        ) : (
          <form action={signInWithOtp} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground border-none rounded-full font-medium text-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              Send code →
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
