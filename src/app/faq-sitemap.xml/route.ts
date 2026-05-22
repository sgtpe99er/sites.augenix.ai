import { headers } from 'next/headers';

import { getFaqSitemapEntries } from '@/lib/faqs';
import { getOrgByDomain } from '@/lib/org';

/**
 * FAQ-specific sitemap (`/faq-sitemap.xml`).
 *
 * Lists every published page that has at least one published FAQ, with
 * `<lastmod>` reflecting the most recently updated FAQ on that page.
 * This helps search engines discover and re-crawl FAQ-rich pages faster.
 *
 * Resolution mirrors the main sitemap: reads the `Host` header, looks up
 * the org by custom_domain, then queries the `get_faq_sitemap_entries` RPC.
 */
export async function GET() {
  const host = (await headers()).get('host');
  const org = await getOrgByDomain(host);
  if (!org) {
    return new Response(xmlWrap(''), {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  const entries = await getFaqSitemapEntries(org.id);
  const baseUrl = `https://${normalizeForUrl(host!)}`;

  const urls = entries.map((entry) => {
    const loc = entry.page_slug === 'homepage'
      ? `${baseUrl}/`
      : `${baseUrl}/${entry.page_slug}`;
    const lastmod = new Date(entry.last_faq_updated).toISOString();
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changeFrequency>weekly</changeFrequency>
    <priority>0.8</priority>
  </url>`;
  });

  return new Response(xmlWrap(urls.join('\n')), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

function xmlWrap(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeForUrl(host: string): string {
  return host.replace(/^www\./i, '').split(':')[0];
}
