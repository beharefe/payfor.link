import {
  siAirtable,
  siDiscord,
  siFigma,
  siGithub,
  siGoogledrive,
  siLoom,
  siNotion,
} from "simple-icons";
import { Link2 } from "lucide-react";

type SimpleIcon = { title: string; path: string };

function BrandSvg({ icon }: { icon: SimpleIcon }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="currentColor"
      aria-label={icon.title}
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}

export const PRODUCTS = [
  { icon: <BrandSvg icon={siNotion} />,      label: "Notion templates" },
  { icon: <BrandSvg icon={siFigma} />,       label: "Figma files" },
  { icon: <BrandSvg icon={siGoogledrive} />, label: "Google Drive" },
  { icon: <BrandSvg icon={siDiscord} />,     label: "Discord invites" },
  { icon: <BrandSvg icon={siGithub} />,      label: "GitHub repos" },
  { icon: <BrandSvg icon={siAirtable} />,    label: "Airtable bases" },
  { icon: <BrandSvg icon={siLoom} />,        label: "Loom videos" },
  {
    icon: <Link2 className="size-4 shrink-0" aria-hidden="true" />,
    label: "Any URL",
  },
] as const;
