# sites.augenix.ai

Augenix Sites — the multi-tenant Next.js renderer that serves every Augenix
client's custom domain. Pairs with the Dashboard (`app.augenix.ai`); both
read/write the same Supabase project (`mfpechdtvbmuykstzyxg`).

## ISR cache + revalidation contract

Sites caches its two hot-path Supabase reads with `unstable_cache` so each
client domain renders from cache and only refetches when the Dashboard tells
it to. The contract between Sites and the Dashboard is the **tag scheme**
(see `src/lib/cache-tags.ts`):

| Tag | Busts | Send when |
| --- | --- | --- |
| `org:host:${normalizedHost}` | one org-by-host lookup | `organizations.custom_domain` is added / removed / renamed (send for both old and new host) |
| `org:id:${orgId}` | the org-by-host lookup AND every page belonging to the org | `logo_url`, `brand_colors`, `brand_fonts`, or org rename |
| `page:${orgId}:${slug}` | one specific page | page publish / unpublish / content edit |

Senders should use the most precise tag they can. Multiple tags can be
busted in one POST (e.g. on a `custom_domain` rename, send the old host
tag, the new host tag, and the org id tag together).

`normalizedHost` = lowercase, leading `www.` stripped, `:port` dropped.
This MUST match what `src/lib/org.ts#normalizeHost` produces — easiest is
just to apply the same transform on the Dashboard side.

### Revalidation endpoint

```
POST https://sites.augenix.ai/api/revalidate
Headers:
  x-revalidate-secret: <REVALIDATE_SECRET>
  content-type: application/json
Body:
  { "tags": ["page:<orgId>:<slug>", "org:id:<orgId>"] }
```

Responses:

- `200 { revalidated: true, tags: [...] }` — tags purged
- `400` — missing / empty / non-string `tags`, or invalid JSON body
- `401` — missing or wrong `x-revalidate-secret`
- `500` — `REVALIDATE_SECRET` env var not configured on the deployment

The shared secret value lives in:

- `sites.augenix.ai` Vercel project → `REVALIDATE_SECRET`
- `app.augenix.ai`  Vercel project → `SITES_REVALIDATE_SECRET`

## Section component library

The Dashboard's AI Command Center writes each page as a freeform JSON array
of sections (see app.augenix.ai PRD §7.1). Sites looks up `section.type` in
`src/components/sections/SectionRenderer.tsx` and renders the matching typed
component; unknown types (or known types whose `content` is malformed) fall
through to `GenericSection`, which prints the structured payload as
labeled key/value pairs.

The 8 registered types are listed below with their expected `content`
shape. The Dashboard's AI prompt mirrors this contract — when adding,
removing, or renaming a section, update the prompt and this README in
the same change.

Every type's parser tolerates missing/optional fields; a section only
falls through to `GenericSection` when a hard requirement (marked
**required** below) is missing or wrong-shaped.

### `hero`

```json
{
  "headline":         "string (required)",
  "subheadline":      "string",
  "ctaText":          "string",
  "ctaLink":          "string (URL)",
  "backgroundImage":  "string (URL)",
  "alignment":        "'left' | 'center' (default: 'center')"
}
```

### `text_block`

```json
{
  "heading": "string",
  "body":    "string (required) — split on blank lines into <p> tags"
}
```

### `image_text`

```json
{
  "heading":       "string",
  "body":          "string (required)",
  "imageUrl":      "string (required, URL)",
  "imageAlt":      "string",
  "imagePosition": "'left' | 'right' (default: 'right')",
  "ctaText":       "string",
  "ctaLink":       "string (URL)"
}
```

### `multi_column`

```json
{
  "heading":    "string",
  "subheading": "string",
  "columns": [
    {
      "title":       "string (required)",
      "description": "string (required)",
      "icon":        "string (single emoji or short character)"
    }
  ]
}
```

`columns` is **required** and must contain at least one valid column.
Grid layout adapts: 1, 2, 3, or 4-up depending on `columns.length`.

### `faq_accordion`

```json
{
  "heading": "string",
  "items": [
    { "question": "string (required)", "answer": "string (required)" }
  ]
}
```

`items` is **required** with at least one valid pair. Uses native
`<details>`/`<summary>` so it ships zero client JS.

### `cta_banner`

```json
{
  "headline":    "string (required)",
  "subheadline": "string",
  "ctaText":     "string (required)",
  "ctaLink":     "string (required, URL)",
  "variant":     "'primary' | 'accent' (default: 'primary')"
}
```

### `testimonials`

```json
{
  "heading": "string",
  "items": [
    {
      "quote":  "string (required)",
      "author": "string (required)",
      "role":   "string",
      "rating": "number 1-5 (clamped, rounded)",
      "avatar": "string (URL)"
    }
  ]
}
```

`items` is **required** with at least one valid testimonial.

### `contact_form`

```json
{
  "heading":     "string",
  "description": "string",
  "fields":      "Array<'name'|'email'|'phone'|'company'|'message'>",
  "submitLabel": "string (default: 'Send message')"
}
```

Renders as a static `<form action method="POST">` that always posts to
the canonical `/api/contact` route handler (`src/app/api/contact/route.ts`),
which writes to the `contacts` table via the `submit_contact_form`
SECURITY DEFINER RPC and 303s back with `?contact=submitted&s=<sectionId>`.
The submit endpoint is intentionally NOT overridable from section
content — see the doc-comment on `ContactFormSection.tsx` for the
history (TL;DR: AI-generated `submitUrl` values broke real customer
forms).

If `fields` is omitted, the default field set is
`['name', 'email', 'message']`. Unknown field strings are silently
dropped.

## Local dev

```
cp .env.example .env.local   # fill in the three vars
npm install
npm run dev
```

`npm run lint`, `npm run typecheck`, and `npm run build` should all be green
before opening a PR.
