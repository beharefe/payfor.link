"use client";

import {
  siAirtable,
  siDiscord,
  siFigma,
  siGithub,
  siGoogledrive,
  siLoom,
  siNotion,
} from "simple-icons";
import { ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";

type SimpleIcon = { title: string; path: string };

function BrandSvg({ icon }: { icon: SimpleIcon }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="currentColor"
      aria-label={icon.title}
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}

const PRODUCTS = [
  {
    icon: <BrandSvg icon={siNotion} />,
    label: "Notion templates",
    desc: "Pages, databases, wikis, full OS systems.",
  },
  {
    icon: <BrandSvg icon={siFigma} />,
    label: "Figma files",
    desc: "Design files, UI kits, icon sets, brand assets.",
  },
  {
    icon: <BrandSvg icon={siGoogledrive} />,
    label: "Google Drive",
    desc: "Docs, sheets, folders, video files.",
  },
  {
    icon: <BrandSvg icon={siDiscord} />,
    label: "Discord invites",
    desc: "Private servers, communities, support groups.",
  },
  {
    icon: <BrandSvg icon={siGithub} />,
    label: "GitHub repos",
    desc: "Code, scripts, templates, boilerplates.",
  },
  {
    icon: <BrandSvg icon={siAirtable} />,
    label: "Airtable bases",
    desc: "Databases, trackers, CRM templates.",
  },
  {
    icon: <BrandSvg icon={siLoom} />,
    label: "Loom videos",
    desc: "Tutorials, walkthroughs, recorded sessions.",
  },
  {
    icon: <Link2 className="size-5 shrink-0" aria-hidden="true" />,
    label: "Any URL",
    desc: "If it has a link, you can charge for it.",
  },
];

const CARD_W = 192; // px — must match w-48
const GAP = 12;     // gap-3

export function ProductScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  function update() {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  function scroll(dir: -1 | 1) {
    ref.current?.scrollBy({ left: dir * (CARD_W + GAP) * 2, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {/* Left fade + button */}
      <div
        className={`absolute left-0 top-0 bottom-0 z-10 flex items-center transition-opacity duration-200 ${canLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="w-16 h-full bg-gradient-to-r from-card to-transparent" />
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute left-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>

      {/* Scroll track */}
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto px-6 pb-1 scrollbar-none snap-x snap-mandatory"
      >
        {PRODUCTS.map((p) => (
          <div
            key={p.label}
            className="w-48 shrink-0 snap-start border border-border rounded-2xl p-4 bg-background flex flex-col gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-foreground">
              {p.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground leading-tight mb-1">
                {p.label}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Right fade + button */}
      <div
        className={`absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end transition-opacity duration-200 ${canRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="w-16 h-full bg-gradient-to-l from-card to-transparent" />
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
