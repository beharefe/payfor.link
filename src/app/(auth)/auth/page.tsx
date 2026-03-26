import { signInWithOtp } from "@unseallink/app/actions/auth";

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
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-medium mb-2">
        Sign in
      </h1>

      {error && (
        <p className="mb-4 text-destructive text-sm">
          {error}
        </p>
      )}

      {sent ? (
        <>
          <p className="text-3xl my-2">✉️</p>
          <p className="font-medium mb-1">Check your inbox</p>
          <p className="text-muted-foreground text-sm">
            We sent an access link to <strong>{email}</strong>. Click it to continue.
          </p>
          <p className="mt-6">
            <a href="/auth" className="text-muted-foreground text-sm">
              Use a different email
            </a>
          </p>
        </>
      ) : (
        <>
          <p className="text-muted-foreground mb-6">
            Enter your email and we&apos;ll send you an access link.
          </p>
          <form action={signInWithOtp}>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring box-border"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-primary-foreground border-none rounded-full font-medium text-base cursor-pointer hover:opacity-90 transition-opacity"
            >
              Send access link
            </button>
          </form>
        </>
      )}
    </main>
  );
}
