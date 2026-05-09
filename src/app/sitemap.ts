import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { getOrgByDomain } from '@/lib/org';
import { listPublishedPages } from '@/lib/pages';

/**
 * Per-org sitemap, served at `https://<custom-domain>/sitemap.xml`.
 *
 * Resolution mirrors `[...slug]/page.tsx`: read the incoming `Host` header,
 * look up the org by `custom_domain`, then enumerate every `is_published=true`
 * page for that org. Each page becomes one `<url>` entry with the page's
 * `updated_at` as `<lastmod>`.
 *
 * If the host doesn't claim an org, return an empty sitemap. The canonical
 * Sites root (`sites.augenix.ai`) intentionally has no public crawlable
 * surface — clients each get their own sitemap on their own domain.
 *
 * Notes on caching:
 * - This file is not in the middleware matcher so it bypasses
 *   `x-augenix-host`. We read the raw `Host` header instead and rely on
 *   `getOrgByDomain` to normalize.
 * - The lookups (`getOrgByDomain` + `listPublishedPages`) are themselves
 *   wrapped in `unstable_cache` with the same tag scheme as the page
 *   renderer, so the Dashboard's existing tag-bust contract
 *   (`org:host:*`, `org:id:*`, `page:*:*` via `POST /api/revalidate`)
 *   automatically refreshes the sitemap when content changes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host');
  const org = await getOrgByDomain(host);
  if (!org) return [];

  const pages = await listPublishedPages(org.id);
  const baseUrl = `https://${normalizeForUrl(host!)}`;

  return pages.map((page) => ({
    url: page.slug === 'homepage' ? `${baseUrl}/` : `${baseUrl}/${page.slug}`,
    lastModified: new Date(page.updated_at),
    changeFrequency: 'weekly',
    priority: page.slug === 'homepage' ? 1.0 : 0.7,
  }));
}

/**
 * Strip the `:port` suffix and a leading `www.` so the canonical URL we emit
 * matches what `[...slug]/page.tsx`'s `generateMetadata` emits as the
 * canonical link. Lowercasing is left to the caller's `Host` header semantics
 * (HTTP hosts are case-insensitive but we don't transform here to avoid
 * surprising clients with non-`www.` lowercased domains they didn't claim).
 */
function normalizeForUrl(host: string): string {
  return host.replace(/^www\./i, '').split(':')[0];
}
