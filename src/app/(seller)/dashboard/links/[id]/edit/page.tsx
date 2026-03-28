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
      "id, title, description, destination_url, price, preview_image_url, expires_at, status, seller_id",
    )
    .eq("id", id)
    .single();

  if (!link || link.seller_id !== user.id) notFound();
  if (link.status === "deleted" || link.status === "suspended") notFound();

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <p className="mb-6">
        <Link href={`/dashboard/links/${id}`}>← Back</Link>
      </p>
      <h1 className="mb-8">Edit link</h1>
      <EditLinkForm
        id={id}
        defaultValues={{
          title: link.title,
          description: link.description ?? "",
          destination_url: link.destination_url,
          price: link.price,
          preview_image_url: link.preview_image_url ?? null,
          expires_at: link.expires_at ?? null,
        }}
      />
    </main>
  );
}
