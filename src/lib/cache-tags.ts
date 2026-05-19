/**
 * Centralized definitions of the cache tags Sites uses with `unstable_cache`
 * and `revalidateTag`. These are also the strings the Dashboard
 * (`app.augenix.ai`) sends to `POST /api/revalidate` when content changes, so
 * the conventions here are part of the Dashboard ↔ Sites contract — keep them
 * stable across releases.
 *
 * Three tags exist today:
 *
 * - `org:host:${normalizedHost}` — busts the org-by-host lookup for one
 *   custom domain. Use when an org's `custom_domain` is added, removed, or
 *   renamed (bust both the old and new host).
 *
 * - `org:id:${orgId}` — busts everything tagged for an org: the org's
 *   branding lookup AND every page belonging to the org. Use when an org's
 *   logo, brand_colors, or brand_fonts change, or when the org is renamed.
 *
 * - `page:${orgId}:${slug}` — busts a single page. Use on publish, unpublish,
 *   or page-content edits.
 *
 * The Dashboard is expected to send the most precise tag(s) it can — e.g. on
 * publish, send only `page:${orgId}:${slug}`; on a branding change, send
 * `org:id:${orgId}`. The endpoint accepts an array so multiple tags can be
 * busted in one request (e.g. on rename: old host tag + new host tag + org
 * id tag in one POST).
 */

export function orgByHostTag(normalizedHost: string): string {
  return `org:host:${normalizedHost}`;
}

export function orgByIdTag(orgId: string): string {
  return `org:id:${orgId}`;
}

export function pageTag(orgId: string, slug: string): string {
  return `page:${orgId}:${slug}`;
}

export function faqsTag(orgId: string, slug: string): string {
  return `faqs:${orgId}:${slug}`;
}
