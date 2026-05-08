import 'server-only';

import { unstable_cache } from 'next/cache';

import { orgByHostTag } from './cache-tags';
import { getSupabaseServerClient } from './supabase/server-client';

export interface OrgLookupRow {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  brand_colors: Record<string, string> | null;
  brand_fonts: Record<string, string> | null;
}

/**
 * Normalize a `Host` header for use as a cache key and as the lookup value
 * against `organizations.custom_domain`. Lowercases, strips a leading `www.`,
 * and drops any `:port` suffix so apex / `www.` / dev-port-stripped variants
 * all resolve to the same cache slot.
 */
function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '').split(':')[0];
}

/**
 * Underlying Supabase fetch for the org-by-host lookup. Uses the
 * `get_org_for_host` SECURITY DEFINER RPC rather than a direct
 * `from('organizations').select(...)` because Sites authenticates as the
 * `anon` role; the RPC is the public-safe column projection (id, name, slug,
 * custom_domain, logo_url, brand_colors, brand_fonts only) and intentionally
 * omits sensitive columns like `stripe_customer_id`, `plan`, `brand_voice`.
 */
async function fetchOrgByHost(normalizedHost: string): Promise<OrgLookupRow | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .rpc('get_org_for_host', { host: normalizedHost })
    .maybeSingle();

  if (error || !data) return null;

  return data as OrgLookupRow;
}

/**
 * Resolve an incoming `Host` header to an Augenix organization by looking up
 * `organizations.custom_domain`. Returns `null` if no organization has claimed
 * this domain.
 *
 * Wrapped in `unstable_cache` and tagged with `org:host:${normalizedHost}` so
 * the Dashboard can bust this entry on its own when it changes an org's
 * `custom_domain` or branding (see `src/lib/cache-tags.ts` for the convention
 * and `/api/revalidate` for the bust mechanism). A 1-hour `revalidate`
 * floor protects against tag-bust requests being lost in transit.
 */
export async function getOrgByDomain(host: string | null): Promise<OrgLookupRow | null> {
  if (!host) return null;

  const normalized = normalizeHost(host);
  if (!normalized) return null;

  // Wrap per-call so the tag list can include the per-host tag. The cache key
  // (second arg) is what dedupes calls — Next-side cache hits are by key, not
  // by closure identity, so wrapping per-call has no perf cost beyond the
  // closure allocation itself.
  const cached = unstable_cache(
    () => fetchOrgByHost(normalized),
    ['sites:org-by-host', normalized],
    {
      tags: [orgByHostTag(normalized)],
      revalidate: 60 * 60,
    },
  );

  return cached();
}
