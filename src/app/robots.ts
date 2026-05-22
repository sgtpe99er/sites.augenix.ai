import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

import { getOrgByDomain } from '@/lib/org';

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

/**
 * Per-org robots.txt, served at `https://<custom-domain>/robots.txt`.
 *
 * Two cases:
 *
 * 1. **Host claimed by an org** — emit an open `Allow: /` for all user-agents
 *    and point search engines at the per-host `/sitemap.xml`. Any client
 *    domain pointing at Sites should be fully indexable.
 *
 * 2. **Host is the canonical Sites domain (`sites.augenix.ai`) or unclaimed**
 *    — emit `Disallow: /` for all user-agents. The canonical Sites root has
 *    no public-facing content (it's just the renderer's landing page) and we
 *    don't want it indexed as if it were the Augenix marketing site. Same
 *    treatment for any unclaimed host that happens to resolve here.
 *
 * Like `sitemap.ts`, this file bypasses middleware (it's in the matcher's
 * exclusion list), so we read the raw `Host` header directly.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host');
  const normalizedHost = host ? host.toLowerCase().split(':')[0] : '';

  if (!host || normalizedHost === SITES_HOST) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  const org = await getOrgByDomain(host);
  if (!org) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  const cleanHost = host.replace(/^www\./i, '').split(':')[0];

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: [
      `https://${cleanHost}/sitemap.xml`,
      `https://${cleanHost}/faq-sitemap.xml`,
    ],
    host: `https://${cleanHost}`,
  };
}
