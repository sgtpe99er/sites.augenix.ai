import 'server-only';

import { unstable_cache } from 'next/cache';

import { blogListTag, blogPostTag, orgByIdTag } from './cache-tags';
import { getSupabaseServerClient } from './supabase/server-client';

export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_html: string | null;
  seo_title: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_width: number | null;
  featured_image_height: number | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_image_alt: string | null;
  category: string | null;
  tags: string[] | null;
  author_name: string | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  updated_at: string | null;
}

/** Slim reference for sitemaps and RSS feeds. */
export interface BlogPostRef {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  updated_at: string | null;
}

async function fetchBlogPosts(
  orgId: string,
  limit: number,
  offset: number,
  category?: string | null,
): Promise<BlogPostRow[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc('get_org_blog_posts', {
    p_org_id: orgId,
    p_limit: limit,
    p_offset: offset,
    p_category: category ?? null,
  });

  if (error || !data) return [];
  return data as BlogPostRow[];
}

/**
 * List published blog posts for an org, cached with tag-based revalidation.
 *
 * Tagged with `blog:${orgId}` so the Dashboard can bust the listing when
 * any blog post is created/updated/deleted, and `org:id:${orgId}` for
 * org-level busts. A 1-hour `revalidate` floor protects against tag-bust
 * requests being lost in transit.
 */
export async function getBlogPosts(
  orgId: string,
  limit = 50,
  offset = 0,
  category?: string | null,
): Promise<BlogPostRow[]> {
  const cacheKey = ['sites:blog-posts', orgId, String(limit), String(offset), category ?? ''];

  const cached = unstable_cache(
    () => fetchBlogPosts(orgId, limit, offset, category),
    cacheKey,
    {
      tags: [blogListTag(orgId), orgByIdTag(orgId)],
      revalidate: 60 * 60,
    },
  );

  return cached();
}

async function fetchBlogPostBySlug(orgId: string, slug: string): Promise<BlogPostRow | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc('get_blog_post_by_slug', {
    p_org_id: orgId,
    p_slug: slug,
  });

  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row as BlogPostRow;
}

/**
 * Fetch a single published blog post by slug, cached with tag-based revalidation.
 *
 * Tagged with `blog:${orgId}:${slug}` for per-post busts and
 * `org:id:${orgId}` for org-level busts.
 */
export async function getBlogPostBySlug(
  orgId: string,
  slug: string,
): Promise<BlogPostRow | null> {
  const cached = unstable_cache(
    () => fetchBlogPostBySlug(orgId, slug),
    ['sites:blog-post', orgId, slug],
    {
      tags: [blogPostTag(orgId, slug), blogListTag(orgId), orgByIdTag(orgId)],
      revalidate: 60 * 60,
    },
  );

  return cached();
}

/**
 * List blog post refs for sitemap/RSS. Uses the same RPC but extracts only
 * the slim fields needed. Cached under the `blog:${orgId}` list tag.
 */
export async function listBlogPostRefs(orgId: string): Promise<BlogPostRef[]> {
  const cached = unstable_cache(
    async () => {
      const posts = await fetchBlogPosts(orgId, 1000, 0);
      return posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        published_at: p.published_at,
        updated_at: p.updated_at,
      }));
    },
    ['sites:blog-post-refs', orgId],
    {
      tags: [blogListTag(orgId), orgByIdTag(orgId)],
      revalidate: 60 * 60,
    },
  );

  return cached();
}
