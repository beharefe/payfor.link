import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const service = createServiceClient();
  const { data: seller } = await service
    .from(TABLES.SELLERS)
    .select("name, bio")
    .eq("username", username)
    .single();

  if (!seller) return { title: "Not found" };

  const displayName = seller.name ?? username;
  const description = seller.bio ?? `Buy digital products from ${displayName} on unseal.link`;
  const ogTitle = `${displayName} on unseal.link`;
  const ogImage = `${APP_URL}/api/og?title=on+unseal.link&seller=${encodeURIComponent(displayName)}`;

  return {
    title: displayName,
    description,
    alternates: { canonical: `${APP_URL}/s/${username}` },
    openGraph: {
      title: ogTitle,
      description,
      url: `${APP_URL}/s/${username}`,
      siteName: "unseal.link",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImage],
    },
  };
}

export default async function SellerProfilePage({ params }: Props) {
  const { username } = await params;
  const service = createServiceClient();

  const { data: seller } = await service
    .from(TABLES.SELLERS)
    .select("id, name, username, bio, avatar_url")
    .eq("username", username)
    .single();

  if (!seller) notFound();

  const { data: products } = await service
    .from(TABLES.PRODUCTS)
    .select("id, title, description, price, currency, slug, total_sales, preview_image_url")
    .eq("seller_id", seller.id)
    .eq("status", "active")
    .order("total_sales", { ascending: false });

  const totalSales = products?.reduce((sum, p) => sum + (p.total_sales ?? 0), 0) ?? 0;

  return (
    <main className="min-h-dvh bg-background">
      {/* Seller header */}
      <section className="pt-16 pb-12 border-b border-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-5">
            {seller.avatar_url ? (
              <Image
                src={seller.avatar_url}
                alt={seller.name ?? username}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-xl font-medium text-muted-foreground">
                  {(seller.name ?? username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-foreground mb-0.5">
                {seller.name ?? username}
              </h1>
              <p className="text-sm text-muted-foreground">
                {(products?.length ?? 0)} {(products?.length ?? 0) === 1 ? "product" : "products"}
                {totalSales > 0 && ` · ${totalSales} sales`}
              </p>
              {seller.bio && (
                <p className="text-sm text-muted-foreground mt-2 max-w-md">{seller.bio}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          {!products?.length ? (
            <p className="text-muted-foreground">No products available yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/@${seller.username}/${product.slug}`}
                  className="border border-border rounded-2xl overflow-hidden no-underline text-foreground hover:border-foreground/30 transition-colors group bg-card"
                >
                  {product.preview_image_url && (
                    <div className="aspect-video w-full overflow-hidden bg-muted relative">
                      <Image
                        src={product.preview_image_url}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="font-medium text-base mb-1 truncate">{product.title}</p>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">
                        ${product.price.toFixed(2)}
                      </p>
                      {(product.total_sales ?? 0) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {product.total_sales} sales
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
