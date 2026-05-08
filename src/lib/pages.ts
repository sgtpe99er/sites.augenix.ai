import 'server-only';

import { unstable_cache } from 'next/cache';

import type { PageContent, PageRecord } from '@/types/content';

import { orgByIdTag, pageTag } from './cache-tags';
import { getSupabaseServerClient } from './supabase/server-client';

/**
 * Underlying Supabase fetch for a single published page. The "Anyone can read
 * published pages" RLS policy on `public.pages` (added in migration
 * 20260508155400_sites_anon_read.sql) lets the anon role read this row
 * directly, so no RPC is needed.
 */
async function fetchPublishedPage(orgId: string, slug: string): Promise<PageRecord | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from('pages')
    .select('id, org_id, slug, title, content, meta_description, is_published, published_at, created_at, updated_at')
    .eq('org_id', orgId)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    org_id: data.org_id,
    slug: data.slug,
    title: data.title,
    content: data.content as PageContent | null,
    meta_description: data.meta_description,
    is_published: data.is_published,
  };
}

/**
 * Fetch a single published page for an organization by slug.
 *
 * `slug` is the page's URL path (e.g. `homepage`, `about`, `services`). The
 * convention used by the Sites renderer is that the apex of a custom domain
 * (`/`) maps to the page with `slug = 'homepage'`; all other paths map 1:1.
 *
 * Wrapped in `unstable_cache` and tagged with `page:${orgId}:${slug}` AND
 * `org:id:${orgId}` so the Dashboard can either bust one specific page (after
 * a publish or content edit) or every page for an org (after a branding /
 * rename change). A 1-hour `revalidate` floor protects against tag-bust
 * requests being lost in transit.
 */
export async function getPublishedPage(orgId: string, slug: string): Promise<PageRecord | null> {
  const cached = unstable_cache(
    () => fetchPublishedPage(orgId, slug),
    ['sites:published-page', orgId, slug],
    {
      tags: [pageTag(orgId, slug), orgByIdTag(orgId)],
      revalidate: 60 * 60,
    },
  );

  return cached();
}
