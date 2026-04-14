import { mdxComponents } from "@unseallink/components/mdx-components";
import { getAllPageSlugs, getPageBySlug } from "@unseallink/lib/mdx";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";

export async function generateStaticParams() {
  return getAllPageSlugs().map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug.join("/"));
  if (!page) return {};
  const { frontmatter } = page;
  return {
    title: frontmatter.og_title ?? frontmatter.title,
    description: frontmatter.og_description ?? frontmatter.description,
    robots: frontmatter.noindex ? "noindex" : "index,follow",
    alternates: { canonical: `${APP_URL}/${page.slug}` },
    openGraph: {
      title: frontmatter.og_title ?? frontmatter.title,
      description: frontmatter.og_description ?? frontmatter.description,
      url: `${APP_URL}/${page.slug}`,
      type: "website",
      siteName: "unseal.link",
      images: [
        {
          url: `${APP_URL}/api/og?title=${encodeURIComponent(frontmatter.og_title ?? frontmatter.title)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.og_title ?? frontmatter.title,
      description: frontmatter.og_description ?? frontmatter.description,
      images: [`${APP_URL}/api/og?title=${encodeURIComponent(frontmatter.og_title ?? frontmatter.title)}`],
    },
  };
}

export default async function MdxPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = getPageBySlug(slug.join("/"));
  if (!page) notFound();

  const { frontmatter, content } = page;

  const related = frontmatter.related
    ? frontmatter.related
        .map((s) => getPageBySlug(s))
        .filter((p): p is NonNullable<typeof p> => p !== null)
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": frontmatter.schema_type ?? "WebPage",
    name: frontmatter.title,
    description: frontmatter.description,
    url: `${APP_URL}/${page.slug}`,
    publisher: {
      "@type": "Organization",
      name: "unseal.link",
      url: APP_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-dvh bg-[#F5F4EF] dark:bg-[#111111] flex flex-col items-stretch font-sans">
        <MDXRemote
          source={content}
          components={mdxComponents}
          options={{ parseFrontmatter: false, blockJS: false }}
        />
        {related.length > 0 && (
          <section className="px-6 py-12 max-w-3xl mx-auto w-full border-t border-[#E5E5E5] dark:border-[#2C2C2C]">
            <p className="text-xs font-medium uppercase tracking-widest text-[#6B6B6B] dark:text-[#999999] mb-5">
              Related guides
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${p.slug}`}
                  className="block p-4 bg-white dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#2C2C2C] rounded-xl text-sm font-medium text-[#111111] dark:text-[#F5F4EF] hover:opacity-70 transition-opacity no-underline"
                >
                  {p.frontmatter.og_title ?? p.frontmatter.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
