/** Returns true if the string contains any non-printable-ASCII characters. */
export function hasUnicodeChars(str: string): boolean {
  return /[^ -~]/.test(str)
}

/** Generate a URL-safe slug from a plain-ASCII title + a random 4-char suffix. */
export function generateSlug(title: string, suffix?: string): string {
  let slug = title.toLowerCase()
  slug = slug.replace(/[\s_]+/g, '-')
  slug = slug.replace(/[^a-z0-9-]/g, '')
  slug = slug.replace(/-+/g, '-')
  slug = slug.replace(/^-+|-+$/g, '')

  if (slug.length < 3) {
    slug = 'product'
  }

  const uniqueSuffix = suffix ?? Math.random().toString(36).slice(2, 6)
  return `${slug}-${uniqueSuffix}`
}
