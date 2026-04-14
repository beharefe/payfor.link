import { mdxComponents } from "@unseallink/components/mdx-components";
import { getAllPageSlugs, getPageBySlug } from "@unseallink/lib/mdx";
import type { Metadata } from "next";
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
      </div>
    </>
  );
}
