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

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, custom_domain, logo_url, brand_colors, brand_fonts')
    .eq('custom_domain', normalized)
    .maybeSingle();

  if (error || !data) return null;

  return data as OrgLookupRow;
}
