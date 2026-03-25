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
    <main style={{ padding: "2rem", maxWidth: "24rem", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "0.5rem" }}>
        Sign in
      </h1>

      {error && (
        <p style={{ marginBottom: "1rem", color: "#C0392B", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}

      {sent ? (
        <>
          <p style={{ fontSize: "2rem", margin: "0.5rem 0" }}>✉️</p>
          <p style={{ fontWeight: 500, marginBottom: "0.25rem" }}>Check your inbox</p>
          <p style={{ color: "#6B6B6B", fontSize: "0.9rem" }}>
            We sent an access link to <strong>{email}</strong>. Click it to continue.
          </p>
          <p style={{ marginTop: "1.5rem" }}>
            <a href="/auth" style={{ color: "#6B6B6B", fontSize: "0.9rem" }}>
              Use a different email
            </a>
          </p>
        </>
      ) : (
        <>
          <p style={{ color: "#6B6B6B", marginBottom: "1.5rem" }}>
            Enter your email and we&apos;ll send you an access link.
          </p>
          <form action={signInWithOtp}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="email" style={{ display: "block", marginBottom: "0.25rem" }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "0.625rem 1rem",
                  border: "1px solid #E5E5E5",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "0.625rem 1.25rem",
                background: "#111111",
                color: "#ffffff",
                border: "none",
                borderRadius: "100px",
                fontWeight: 500,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Send access link
            </button>
          </form>
        </>
      )}
    </main>
  );
}
