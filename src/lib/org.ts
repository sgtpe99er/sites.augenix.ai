import 'server-only';

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
 * Resolve an incoming `Host` header to an Augenix organization by looking up
 * `organizations.custom_domain`. Returns `null` if no organization has claimed
 * this domain.
 *
 * The host comparison is case-insensitive and ignores any leading `www.`
 * subdomain, since most clients want both apex and `www` to render the same
 * site.
 */
export async function getOrgByDomain(host: string | null): Promise<OrgLookupRow | null> {
  if (!host) return null;

  const normalized = host.toLowerCase().replace(/^www\./, '').split(':')[0];
  if (!normalized) return null;

  const supabase = getSupabaseServerClient();

  // We go through the `get_org_for_host` SECURITY DEFINER RPC rather than a
  // direct `from('organizations').select(...)` because Sites authenticates as
  // the `anon` role. The underlying table's RLS only exposes rows to org
  // members; the RPC is the public-safe projection (id, name, slug,
  // custom_domain, logo_url, brand_colors, brand_fonts only) and intentionally
  // omits sensitive columns like stripe_customer_id, plan, brand_voice.
  const { data, error } = await supabase
    .rpc('get_org_for_host', { host: normalized })
    .maybeSingle();

  if (error || !data) return null;

  return data as OrgLookupRow;
}
