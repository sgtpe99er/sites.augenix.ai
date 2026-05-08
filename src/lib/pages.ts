import 'server-only';

import type { PageContent, PageRecord } from '@/types/content';

import { getSupabaseServerClient } from './supabase/server-client';

/**
 * Fetch a single published page for an organization by slug.
 *
 * `slug` is the page's URL path (e.g. `homepage`, `about`, `services`). The
 * convention used by the Sites renderer is that the apex of a custom domain
 * (`/`) maps to the page with `slug = 'homepage'`; all other paths map 1:1.
 */
export async function getPublishedPage(orgId: string, slug: string): Promise<PageRecord | null> {
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
