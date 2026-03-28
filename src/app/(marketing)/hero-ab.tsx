"use client";

import { track } from "@unseallink/lib/amplitude";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// A/B variants for the hero headline.
// Change copy here — variant key is what gets sent to Amplitude.
const VARIANTS = {
  A: { line1: "Get paid before", line2: "you share anything." },
  B: { line1: "Lock any link", line2: "behind a payment." },
} as const;

type Variant = keyof typeof VARIANTS;

function getOrAssignVariant(): Variant {
  try {
    const stored = localStorage.getItem("hero_variant") as Variant | null;
    if (stored && stored in VARIANTS) return stored;
    const v: Variant = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem("hero_variant", v);
    return v;
  } catch {
    return "A";
  }
}

export function HeroHeadline() {
  const [variant, setVariant] = useState<Variant>("A");
  const tracked = useRef(false);

  useEffect(() => {
    const v = getOrAssignVariant();
    setVariant(v);
    if (!tracked.current) {
      tracked.current = true;
      track({ name: "hero_variant_seen", props: { variant: v } });
    }
  }, []);

  const { line1, line2 } = VARIANTS[variant];

  return (
    <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-medium tracking-tight leading-[1.05] mb-6 text-foreground">
      {line1}
      <br />
      {line2}
    </h1>
  );
}

export function HeroCTA({
  href,
  label,
  location,
  className,
}: {
  href: string;
  label: string;
  location: string;
  className?: string;
}) {
  const variant = useRef<string>("A");

  useEffect(() => {
    variant.current = localStorage.getItem("hero_variant") ?? "A";
  }, []);

  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        track({
          name: "cta_clicked",
          props: { location, label, variant: variant.current },
        })
      }
    >
      {label}
    </Link>
  );
}
