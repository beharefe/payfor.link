import Link from "next/link";
import { NewLinkForm } from "./new-link-form";

export default function NewLinkPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "32rem", margin: "0 auto" }}>
      <h1>Create link</h1>
      <p>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <NewLinkForm />
    </main>
  );
}
