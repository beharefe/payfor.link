import { TABLES } from "@unseallink/lib/db";
import { createClient } from "@unseallink/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditLinkForm } from "./edit-link-form";

export default async function EditLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: link } = await supabase
    .from(TABLES.PRODUCTS)
    .select(
      "id, title, description, destination_url, price, preview_image_url, status, seller_id",
    )
    .eq("id", id)
    .single();

  if (!link || link.seller_id !== user.id) notFound();
  if (link.status === "deleted" || link.status === "suspended") notFound();

  return (
    <main style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        <Link href={`/dashboard/links/${id}`}>← Back</Link>
      </p>
      <h1 style={{ marginBottom: "2rem" }}>Edit link</h1>
      <EditLinkForm
        id={id}
        defaultValues={{
          title: link.title,
          description: link.description ?? "",
          destination_url: link.destination_url,
          price: link.price,
          preview_image_url: link.preview_image_url ?? null,
        }}
      />
    </main>
  );
}
