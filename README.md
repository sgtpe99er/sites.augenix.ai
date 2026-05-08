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

## Local dev

```
cp .env.example .env.local   # fill in the three vars
npm install
npm run dev
```

`npm run lint`, `npm run typecheck`, and `npm run build` should all be green
before opening a PR.
