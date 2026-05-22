import { headers } from 'next/headers';

import { listBlogPostRefs } from '@/lib/blog';
import { getOrgByDomain } from '@/lib/org';

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * RSS 2.0 feed with Atom self-link at /blog/feed.xml.
 *
 * Served as a GET route handler so it returns proper `application/rss+xml`
 * content type. Uses the same Supabase RPCs and caching as the blog listing.
 */
export async function GET() {
  const host = ((await headers()).get('x-augenix-host') ?? SITES_HOST).toLowerCase();
  const org = await getOrgByDomain(host);

  if (!org) {
    return new Response('<rss version="2.0"><channel></channel></rss>', {
      status: 404,
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    });
  }

  const cleanHost = host.replace(/^www\./i, '').split(':')[0];
  const baseUrl = `https://${cleanHost}`;
  const feedUrl = `${baseUrl}/blog/feed.xml`;

  const posts = await listBlogPostRefs(org.id);

  const lastBuildDate =
    posts.length > 0 && posts[0].published_at
      ? new Date(posts[0].published_at).toUTCString()
      : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${baseUrl}/blog/${post.slug}`;
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : '';
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>${pubDate ? `\n      <pubDate>${pubDate}</pubDate>` : ''}${post.excerpt ? `\n      <description>${escapeXml(post.excerpt)}</description>` : ''}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(org.name)} Blog</title>
    <link>${escapeXml(baseUrl)}/blog</link>
    <description>Latest blog posts from ${escapeXml(org.name)}.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
