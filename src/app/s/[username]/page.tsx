import { TABLES } from "@unseallink/lib/db";
import { createServiceClient } from "@unseallink/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const service = createServiceClient();
  const { data: seller } = await service
    .from(TABLES.SELLERS)
    .select("name, bio")
    .eq("name", username)
    .single();

  if (!seller) return { title: "Not found" };

  return {
    title: seller.name ?? username,
    description: seller.bio ?? `Buy digital products from ${seller.name ?? username} on unseal.link`,
  };
}

export default async function SellerProfilePage({ params }: Props) {
  const { username } = await params;
  const service = createServiceClient();

  const { data: seller } = await service
    .from(TABLES.SELLERS)
    .select("id, name, bio, avatar_url")
    .eq("name", username)
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
    <main className="p-8 max-w-2xl mx-auto">
      {/* Seller header */}
      <div className="flex items-center gap-4 mb-8">
        {seller.avatar_url && (
          <img
            src={seller.avatar_url}
            alt={seller.name ?? username}
            className="w-16 h-16 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold mb-0.5">{seller.name ?? username}</h1>
          <p className="text-sm text-muted-foreground">
            {(products?.length ?? 0)} {(products?.length ?? 0) === 1 ? "product" : "products"}
            {totalSales > 0 && ` · ${totalSales} sales`}
          </p>
          {seller.bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">{seller.bio}</p>
          )}
        </div>
      </div>

      {/* Products */}
      {!products?.length ? (
        <p className="text-muted-foreground">No products available yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/@${seller.name}/${product.slug}`}
              className="border border-border rounded-2xl overflow-hidden no-underline text-foreground hover:border-foreground/30 transition-colors group"
            >
              {product.preview_image_url && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={product.preview_image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base mb-1 truncate">{product.title}</p>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    {(product.total_sales ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {product.total_sales} purchases
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-base shrink-0">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
