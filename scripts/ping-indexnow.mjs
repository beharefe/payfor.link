#!/usr/bin/env node
// One-time IndexNow batch submission for all existing marketing pages.
// Usage: INDEXNOW_KEY=<key> NEXT_PUBLIC_APP_URL=https://unseal.link node scripts/ping-indexnow.mjs

import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CONTENT_DIR = join(__dirname, "../content/pages");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://unseal.link";
const KEY = process.env.INDEXNOW_KEY;

if (!KEY) {
  console.error("Error: INDEXNOW_KEY env var is required.");
  process.exit(1);
}

function isNoindex(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return false;
  return match[1].includes("noindex: true");
}

async function getMdxUrls() {
  const files = await readdir(CONTENT_DIR);
  const mdxFiles = files.filter((f) => f.endsWith(".mdx"));
  const urls = [];

  for (const file of mdxFiles) {
    const content = await readFile(join(CONTENT_DIR, file), "utf-8");
    if (isNoindex(content)) continue;
    const slug = basename(file, ".mdx");
    urls.push(`${APP_URL}/${slug}`);
  }

  return urls;
}

async function submit(urls) {
  const host = new URL(APP_URL).hostname;
  console.log(`Submitting ${urls.length} URLs to IndexNow...`);

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: KEY,
      keyLocation: `${APP_URL}/${KEY}.txt`,
      urlList: urls,
    }),
  });

  console.log(`Response: ${res.status} ${res.statusText}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Body:", body);
  }
}

const staticUrls = [APP_URL, `${APP_URL}/about`];
const mdxUrls = await getMdxUrls();
const allUrls = [...staticUrls, ...mdxUrls];

console.log("URLs to submit:");
for (const u of allUrls) console.log(" ", u);
console.log();

await submit(allUrls);
