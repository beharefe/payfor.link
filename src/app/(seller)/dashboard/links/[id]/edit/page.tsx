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
      "id, title, description, destination_url, price, preview_image_url, expires_at, status, seller_id, subtitle, includes, faq",
    )
    .eq("id", id)
    .single();

  if (!link || link.seller_id !== user.id) notFound();
  if (link.status === "deleted" || link.status === "suspended") notFound();

  return (
    <main>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`/dashboard/links/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline block mb-6"
        >
          ← Back
        </Link>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
          Edit link
        </p>
        <h1 className="text-2xl font-medium tracking-tight text-foreground mb-8">
          {link.title}
        </h1>
        <EditLinkForm
          id={id}
          defaultValues={{
            title: link.title,
            description: link.description ?? "",
            destination_url: link.destination_url,
            price: link.price,
            preview_image_url: link.preview_image_url ?? null,
            expires_at: link.expires_at ?? null,
            subtitle: link.subtitle ?? null,
            // biome-ignore lint/suspicious/noExplicitAny: JSONB from Supabase
            includes: (link.includes as string[] | null) ?? null,
            // biome-ignore lint/suspicious/noExplicitAny: JSONB from Supabase
            faq: (link.faq as Array<{ q: string; a: string }> | null) ?? null,
          }}
        />
      </div>
    </main>
  );
}
