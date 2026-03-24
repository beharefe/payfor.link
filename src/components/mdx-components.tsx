import type { MDXComponents } from "mdx/types";
import Link from "next/link";

// ---------- Layout primitives ----------

export function Hero({
  title,
  subtitle,
  cta = "Start selling free",
  ctaHref = "/auth",
  note,
}: {
  title: string;
  subtitle: string;
  cta?: string;
  ctaHref?: string;
  note?: string;
}) {
  return (
    <section className="flex flex-col items-center text-center px-6 py-24 gap-6">
      <h1 className="text-4xl sm:text-5xl font-medium tracking-tight leading-[1.1] max-w-2xl text-[#111111] dark:text-[#F5F4EF]">
        {title}
      </h1>
      <p className="text-lg text-[#6B6B6B] dark:text-[#999999] max-w-xl">{subtitle}</p>
      <Link
        href={ctaHref}
        className="mt-2 inline-block px-7 py-3 bg-[#111111] dark:bg-[#F5F4EF] text-white dark:text-[#111111] font-medium rounded-full text-base hover:opacity-80 transition-opacity"
      >
        {cta}
      </Link>
      {note && <p className="text-sm text-[#6B6B6B] dark:text-[#999999]">{note}</p>}
    </section>
  );
}

export function FeatureList({ items }: { items: { icon: string; title: string; body: string }[] }) {
  return (
    <section className="px-6 py-16 max-w-4xl mx-auto w-full">
      <div className="grid sm:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.title}
            className="bg-white dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#2C2C2C] rounded-2xl p-6 flex flex-col gap-3"
          >
            <span className="text-3xl">{item.icon}</span>
            <h3 className="font-medium text-[#111111] dark:text-[#F5F4EF]">{item.title}</h3>
            <p className="text-sm text-[#6B6B6B] dark:text-[#999999]">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <section className="px-6 py-16 bg-white dark:bg-[#1C1C1C] w-full">
      <div className="max-w-3xl mx-auto flex flex-col gap-0">
        {items.map((item, i) => (
          <div key={item.title} className="flex gap-6 py-8 border-b border-[#E5E5E5] dark:border-[#2C2C2C] last:border-0">
            <span className="text-sm font-medium text-[#6B6B6B] dark:text-[#999999] tabular-nums mt-0.5 min-w-[1.5rem]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-medium text-[#111111] dark:text-[#F5F4EF] mb-1">{item.title}</h3>
              <p className="text-sm text-[#6B6B6B] dark:text-[#999999]">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeeCallout({ keep = "95.5" }: { keep?: string }) {
  return (
    <section className="px-6 py-12 max-w-3xl mx-auto w-full">
      <div className="bg-[#111111] dark:bg-[#F5F4EF] rounded-2xl p-8 text-center">
        <p className="text-4xl font-medium text-white dark:text-[#111111] mb-2">Keep {keep}%</p>
        <p className="text-[#999999] dark:text-[#6B6B6B] text-sm">
          We take a 4.5% platform fee. Stripe fees apply separately. No monthly plans, no hidden cuts.
        </p>
      </div>
    </section>
  );
}

export function CTA({
  text = "Start selling",
  href = "/auth",
  sub,
}: {
  text?: string;
  href?: string;
  sub?: string;
}) {
  return (
    <section className="px-6 py-20 flex flex-col items-center gap-4 text-center">
      <Link
        href={href}
        className="inline-block px-8 py-4 bg-[#111111] dark:bg-[#F5F4EF] text-white dark:text-[#111111] font-medium rounded-full text-lg hover:opacity-80 transition-opacity"
      >
        {text}
      </Link>
      {sub && <p className="text-sm text-[#6B6B6B] dark:text-[#999999]">{sub}</p>}
    </section>
  );
}

export function FAQ({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section className="px-6 py-16 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-medium text-[#111111] dark:text-[#F5F4EF] mb-8 text-center">
        Frequently asked
      </h2>
      <div className="flex flex-col divide-y divide-[#E5E5E5] dark:divide-[#2C2C2C]">
        {items.map((item) => (
          <div key={item.q} className="py-6">
            <p className="font-medium text-[#111111] dark:text-[#F5F4EF] mb-2">{item.q}</p>
            <p className="text-sm text-[#6B6B6B] dark:text-[#999999]">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- Standard HTML elements ----------

export const mdxComponents: MDXComponents = {
  Hero,
  FeatureList,
  Steps,
  FeeCallout,
  CTA,
  FAQ,
  h1: (props) => (
    <h1
      className="text-3xl sm:text-4xl font-medium tracking-tight text-[#111111] dark:text-[#F5F4EF] mb-4 px-6 max-w-3xl mx-auto w-full"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="text-2xl font-medium text-[#111111] dark:text-[#F5F4EF] mb-3 px-6 max-w-3xl mx-auto w-full"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="text-lg font-medium text-[#111111] dark:text-[#F5F4EF] mb-2 px-6 max-w-3xl mx-auto w-full"
      {...props}
    />
  ),
  p: (props) => (
    <p
      className="text-base text-[#6B6B6B] dark:text-[#999999] leading-relaxed mb-4 px-6 max-w-3xl mx-auto w-full"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="list-disc list-inside text-[#6B6B6B] dark:text-[#999999] mb-4 px-6 max-w-3xl mx-auto w-full space-y-1"
      {...props}
    />
  ),
  a: ({ href = "#", ...props }) => (
    <Link href={href} className="underline text-[#111111] dark:text-[#F5F4EF] hover:opacity-60" {...props} />
  ),
};
