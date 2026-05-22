import 'server-only';

import { unstable_cache } from 'next/cache';

import { faqsTag, orgByIdTag } from './cache-tags';
import { getSupabaseServerClient } from './supabase/server-client';

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  category: string | null;
}

/**
 * Fetch published FAQs for a specific page via the `get_page_faqs` RPC.
 *
 * The RPC is SECURITY DEFINER and callable with the anon key — it only
 * returns published FAQs for the given org/page pair.
 */
async function fetchPageFaqs(orgId: string, pageSlug: string): Promise<FaqRow[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc('get_page_faqs', {
    p_org_id: orgId,
    p_page_slug: pageSlug,
  });

  if (error || !data) return [];

  return data as FaqRow[];
}

/**
 * Get published FAQs for a page, cached with tag-based revalidation.
 *
 * Tagged with `faqs:${orgId}:${slug}` so the Dashboard can bust this
 * cache entry when FAQs are added/edited/removed for a page, and also
 * with `org:id:${orgId}` for org-level busts.
 */
export async function getPageFaqs(orgId: string, pageSlug: string): Promise<FaqRow[]> {
  const cached = unstable_cache(
    () => fetchPageFaqs(orgId, pageSlug),
    ['sites:page-faqs', orgId, pageSlug],
    {
      tags: [faqsTag(orgId, pageSlug), orgByIdTag(orgId)],
      revalidate: 60 * 60,
    },
  );

  return cached();
}

export interface FaqSitemapEntry {
  page_slug: string;
  page_title: string;
  faq_count: number;
  last_faq_updated: string;
}

async function fetchFaqSitemapEntries(orgId: string): Promise<FaqSitemapEntry[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_faq_sitemap_entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ p_org_id: orgId }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as FaqSitemapEntry[];
  } catch {
    return [];
  }
}

/**
 * List pages that have published FAQs, with the most recent FAQ update
 * timestamp. Used to build `/faq-sitemap.xml`.
 */
export async function getFaqSitemapEntries(orgId: string): Promise<FaqSitemapEntry[]> {
  const cached = unstable_cache(
    () => fetchFaqSitemapEntries(orgId),
    ['sites:faq-sitemap', orgId],
    {
      tags: [orgByIdTag(orgId)],
      revalidate: 60 * 60,
    },
  );

  return cached();
}
