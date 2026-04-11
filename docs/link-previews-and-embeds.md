# unseal.link: link previews, embeds, and competitive moat

**unseal.link sits in genuine whitespace — no competitor offers "paste any URL → paid link → delivery" with a developer API.** At **4.5% fees** versus Gumroad's 10% and Lemon Squeezy's 5% + $0.50, the pricing alone is a moat. But three technical investments will determine whether unseal.link becomes infrastructure or stays a tool: perfect link previews (because the shared link *is* the storefront), an embeddable buy button (because sellers live on their own sites), and an API with file hosting (because developers are the distribution channel). This report covers the exact specs, code, and strategy for all three.

---

## Part 1: Every platform's link preview behavior, decoded

The core challenge is that **no platform executes JavaScript** when generating link previews. Every crawler — Twitterbot, Discordbot, Slackbot, facebookexternalhit, WhatsApp, Telegram, Apple — reads raw HTML only. All OG tags must be server-rendered and placed early in `<head>` (within the **first 32KB** of HTML for Slack's crawler, which sends a `Range: bytes=0-32767` header).

### Twitter/X

Use `summary_large_image` for maximum visual impact. Twitter reads `twitter:*` tags first (using the `name` attribute, not `property`), falling back to `og:` equivalents for individual fields. Without `twitter:card`, Twitter defaults to `summary` (small thumbnail) — so always explicitly set the card type. **Image spec: 1200×630px, under 5MB, JPG/PNG/WebP.** Title truncates around **70 characters**, description around **200**. Cache TTL is approximately 7 days.

### Discord

Discord reads **Open Graph tags exclusively** — it ignores `twitter:image` if `og:image` is absent. The unique Discord feature is the **theme-color sidebar**: `<meta name="theme-color" content="#111111">` sets a branded color bar on the left of every embed. Images must be at least **400×300px** to trigger the large-image layout. Title limit is 256 characters, description truncates around 350. Cache is 20–30 minutes — append `?v=2` as a workaround.

### Slack — the hidden superpower

Slack's priority order: oEmbed → Twitter Card tags → OG tags → HTML meta description. The critical discovery for unseal.link is that **Slack renders `twitter:label1`/`twitter:data1` as structured key-value metadata** in unfurls:

```html
<meta name="twitter:label1" content="Price" />
<meta name="twitter:data1" content="$9.99" />
<meta name="twitter:label2" content="Seller" />
<meta name="twitter:data2" content="designstudio" />
```

This is the **only cross-platform way to show structured price data in a link preview** — and ironically, these tags don't render on Twitter itself.

### WhatsApp — the strictest platform

WhatsApp reads only `og:*` tags (ignores Twitter Card tags). The critical constraint: **OG images must be under 300KB** or they're silently dropped. Use JPEG and aggressive compression. Minimum image size is 300×200px. WhatsApp crops to a near-square from center, so keep key content centered. Caching is 3–7+ days (append query parameters to bust cache).

### Telegram, iMessage, LinkedIn, Facebook

**Telegram** reads OG tags primarily, Twitter tags as fallback. Cache persists indefinitely but can be refreshed via **@WebpageBot**.

**iMessage** does not show `og:description` — only the title and image render. Title truncates at ~44 characters.

**LinkedIn** allows up to **150 characters** for titles. Always include `og:image:width` and `og:image:height`. Use Post Inspector to refresh cache.

**Facebook** parses `product:price:amount` and `product:price:currency` tags (prefix is `product:`, not `og:price:`), but does not visually render price in the link card. These tags feed Facebook's commerce features internally.

### Can previews show price, buttons, or structured data?

**No platform renders interactive elements** in OG-based link previews. The only way to show price is:

- **Burn it into the OG image** (works everywhere — most impactful)
- **Include it in `og:title`** (e.g., "Premium Template — $9.99")
- **Include it in `og:description`** (visible on most platforms except iMessage)
- **Use `twitter:data1` for Slack** (structured "Price: $9.99" display)

### The ideal meta tag implementation for unseal.link

```html
<head>
  <!-- Primary OG -->
  <meta property="og:type" content="product" />
  <meta property="og:url" content="https://unseal.link/@username/slug" />
  <meta property="og:title" content="Premium Dashboard Template — $9.99" />
  <meta property="og:description" content="Pay once with Stripe and get instant access. No account needed." />
  <meta property="og:image" content="https://unseal.link/api/og/slug" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="unseal.link" />

  <!-- Facebook product tags -->
  <meta property="product:price:amount" content="9.99" />
  <meta property="product:price:currency" content="USD" />

  <!-- Twitter/X Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@unseallink" />
  <meta name="twitter:title" content="Premium Dashboard Template — $9.99" />
  <meta name="twitter:description" content="Pay once with Stripe and get instant access." />
  <meta name="twitter:image" content="https://unseal.link/api/og/slug" />

  <!-- Slack structured data (renders as key-value pairs in Slack unfurls) -->
  <meta name="twitter:label1" content="Price" />
  <meta name="twitter:data1" content="$9.99" />
  <meta name="twitter:label2" content="Seller" />
  <meta name="twitter:data2" content="designstudio" />

  <!-- Discord brand color sidebar -->
  <meta name="theme-color" content="#111111" />
</head>
```

### Dynamic OG image generation: Satori via @vercel/og

`@vercel/og` (Satori-based) converts JSX to PNG via WebAssembly on the Edge Runtime in under 100ms — ~50× faster than Puppeteer. Design constraints:

- Keep key content **centered** (WhatsApp center-crops)
- Stay away from corners (Twitter rounds them)
- **Compress to under 300KB as JPEG** (WhatsApp requirement)
- Design for dark backgrounds (Discord users are mostly in dark mode)
- Show product title prominently, **price as the largest visual element**, seller name, unseal.link branding

| Platform | Key gotcha |
|---|---|
| Twitter/X | Must set `twitter:card` explicitly or defaults to small thumbnail |
| Discord | Set `theme-color` for brand sidebar; `og:image` required |
| Slack | Add `twitter:label1`/`data1` for price; keep OG tags in first 32KB |
| WhatsApp | Compress image to **<300KB JPEG**; fast server response mandatory |
| iMessage | `og:description` not displayed; title truncates at 44 chars |
| Telegram | Use @WebpageBot to refresh cache |
| LinkedIn | Include `og:image:width`/`height`; use Post Inspector for cache refresh |

---

## Part 2: The embeddable buy button

### Pattern chosen for unseal.link

Anchor tag with script upgrade — the simplest possible integration with graceful degradation:

```html
<script async src="https://unseal.link/embed.js"></script>
<a href="https://unseal.link/@username/slug" class="unseal-button">
  Buy — $9.99
</a>
```

Also supports Web Component syntax:

```html
<unseal-button url="https://unseal.link/@username/slug" label="Buy — $9.99"></unseal-button>
```

**Why this approach:**
- Zero dependencies, one `<script>` tag
- Works without JavaScript (the link is a normal anchor)
- Shadow DOM isolation via Web Component (no style conflicts)
- Opens checkout in a popup window (centered, 480×700px)
- "⚡ unseal.link" badge drives viral discovery

### The "Powered by" viral loop

- **ClickFunnels** attributes $1M+ MRR directly to "Powered by ClickFunnels" badges
- **Tally Forms** grew to $4M revenue primarily through embed virality
- **Turtl** gets 30–50% of new leads from "Powered by" placements

Every embedded button is a brand impression. On paid plans, allow sellers to remove branding (`powered-by="false"` attribute).

### Embed code shown in dashboard

The dashboard link detail page shows copy-pasteable embed code for each link.

---

## Part 3: API and file hosting (future)

### API opportunity

No competitor offers "create a paid link to any URL via API" as a core primitive. The v1 API needs five endpoint groups:

```
POST   /v1/links
GET    /v1/links/:id
PATCH  /v1/links/:id
GET    /v1/links/:id/purchases
POST   /v1/webhooks
```

Webhook events: `purchase.completed`, `purchase.refunded`, `link.updated`. Auth: Bearer token API keys with test/live pairs.

### Publish API docs before the API exists

Show working-looking code on the homepage to drive developer interest and waitlist signups:

```javascript
const link = await unseal.links.create({
  url: "https://example.com/premium-guide",
  price: 999, // $9.99 in cents
  currency: "usd",
  title: "Premium Guide"
});
// → { id: "lnk_abc123", paywall_url: "https://unseal.link/@username/slug" }
```

### File hosting benchmarks

- Gumroad: 16GB per file, unlimited storage
- Lemon Squeezy: 5GB per product, signed URLs expire in 1 hour, 10 downloads/day per IP
- Target for unseal.link: 5GB+ file size limit, signed expiring URLs, auto-revoke on refund, CDN delivery, encryption at rest

---

## Conclusion

These three investments create a flywheel: **perfect previews** make every share a storefront → **embed buttons** expand distribution to blogs and newsletters with a viral "Powered by" loop → **API** transforms unseal.link into infrastructure. The competitive moat is the combination of the simplest creation flow, widest distribution surface, and lowest fees in the category.
