import type { JSX } from "react";

type P = { size?: number; className?: string };

export function NotionIcon({ size = 24, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#000" />
      {/* Notion's characteristic serifed N */}
      <path d="M7 6.5h2.6l4.1 8.1V6.5H16v11h-2.6L9.3 9.4V17.5H7V6.5Z" fill="#fff" />
    </svg>
  );
}

export function FigmaIcon({ size = 24, className }: P) {
  /* 5-node mark: left column top→bottom = red/purple/blue, right column = orange/green */
  const r = size / 4.8;
  const col1 = size * 0.27;
  const col2 = size * 0.73;
  const row1 = size * 0.18;
  const row2 = size * 0.5;
  const row3 = size * 0.82;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className={className} aria-hidden="true">
      <circle cx={col1} cy={row1} r={r} fill="#F24E1E" />
      <circle cx={col2} cy={row1} r={r} fill="#FF7262" />
      <circle cx={col1} cy={row2} r={r} fill="#A259FF" />
      <circle cx={col2} cy={row2} r={r} fill="#0ACF83" />
      <circle cx={col1} cy={row3} r={r} fill="#1ABCFE" />
    </svg>
  );
}

export function DiscordIcon({ size = 24, className }: P) {
  /* Official Discord Wumpus/Clyde path */
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#5865F2" className={className} aria-hidden="true">
      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.2 13.2 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
    </svg>
  );
}

export function GitHubIcon({ size = 24, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function GoogleDriveIcon({ size = 24, className }: P) {
  /* Tricolor triangle: blue left, green right, yellow bottom */
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2L1 21.5H12L12 13.5L12 2Z" fill="#4285F4" />
      <path d="M12 2L23 21.5H12L12 13.5L12 2Z" fill="#34A853" />
      <path d="M1 21.5H23L12 13.5L1 21.5Z" fill="#FBBC04" />
    </svg>
  );
}

export function CanvaIcon({ size = 24, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#7D2AE8" />
      {/* C arc: open circle facing right */}
      <path
        d="M16 8.5A6 6 0 1 0 16 15.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function AirtableIcon({ size = 24, className }: P) {
  /* Airtable "a" mark: colored rounded square with white grid lines */
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" rx="2" fill="#FCB400" />
      <rect x="13" y="1" width="10" height="10" rx="2" fill="#18BFFF" />
      <rect x="1" y="13" width="10" height="10" rx="2" fill="#F82B60" />
      <rect x="13" y="13" width="10" height="10" rx="2" fill="#20C933" />
    </svg>
  );
}

export function FreeUnlockIcon({ size = 24, className }: P) {
  /* Open padlock */
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function OtherAccessIcon({ size = 24, className }: P) {
  /* Chain link / unlock */
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const PLATFORM_ICON: Record<string, (props: P) => JSX.Element> = {
  notion: NotionIcon,
  figma: FigmaIcon,
  discord: DiscordIcon,
  github: GitHubIcon,
  gitlab: GitHubIcon,
  google_drive: GoogleDriveIcon,
  google_docs: GoogleDriveIcon,
  google_sheets: GoogleDriveIcon,
  canva: CanvaIcon,
  airtable: AirtableIcon,
  free: FreeUnlockIcon,
  other: OtherAccessIcon,
};
