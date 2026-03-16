import Link from "next/link";
import { NewLinkForm } from "./new-link-form";

export default async function NewLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main style={{ padding: "2rem", maxWidth: "32rem", margin: "0 auto" }}>
      <h1>Create link</h1>
      <p>
        <Link href="/studio">← Studio</Link>
      </p>
      {error && (
        <p style={{ color: "red", marginBottom: "1rem" }}>{decodeURIComponent(error)}</p>
      )}
      <NewLinkForm />
    </main>
  );
}
