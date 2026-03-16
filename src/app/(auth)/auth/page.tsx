import { signInWithOtp, verifySellerOtp } from "@payforlink/app/actions/auth";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; email?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const email = params.email ? decodeURIComponent(params.email) : "";
  const error = params.error ? decodeURIComponent(params.error) : null;

  return (
    <main style={{ padding: "2rem", maxWidth: "24rem", margin: "0 auto" }}>
      <h1>Sign in</h1>

      {error && (
        <p style={{ marginBottom: "1rem", color: "red" }}>{error}</p>
      )}

      {!sent ? (
        <>
          <p>Enter your email and we&apos;ll send you a 6-digit code.</p>
          <form action={signInWithOtp}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
              />
            </div>
            <button type="submit" style={{ padding: "0.5rem 1rem" }}>
              Send code
            </button>
          </form>
        </>
      ) : (
        <>
          <p>
            Enter the 6-digit code we sent to <strong>{email}</strong>
          </p>
          <form action={verifySellerOtp}>
            <input type="hidden" name="email" value={email} />
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="code">Code</label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                required
                style={{ display: "block", padding: "0.5rem", fontSize: "1.25rem", width: "8rem", marginTop: "0.25rem" }}
              />
            </div>
            <button type="submit" style={{ padding: "0.5rem 1rem" }}>
              Verify
            </button>
          </form>
          <p style={{ marginTop: "1rem" }}>
            <a href="/auth">Use a different email</a>
          </p>
        </>
      )}
    </main>
  );
}
