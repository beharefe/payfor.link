import { signInWithMagicLink } from "@payforlink/app/actions/auth";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = params.error;

  return (
    <main style={{ padding: "2rem", maxWidth: "24rem", margin: "0 auto" }}>
      <h1>Sign in</h1>
      <p>Enter your email and we&apos;ll send you a magic link.</p>
      {sent && (
        <p style={{ marginBottom: "1rem", color: "green" }}>
          Check your email for the sign-in link.
        </p>
      )}
      {error && (
        <p style={{ marginBottom: "1rem", color: "red" }}>{decodeURIComponent(error)}</p>
      )}
      <form
        action={async (formData: FormData) => {
          await signInWithMagicLink(formData);
        }}
        method="post"
      >
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.25rem",
            }}
          />
        </div>
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Send magic link
        </button>
      </form>
    </main>
  );
}
