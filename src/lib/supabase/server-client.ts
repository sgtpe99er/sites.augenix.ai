import { createServerClient } from '@supabase/ssr';

import type { Database } from './types';

/**
 * Server-side Supabase client for the Sites project.
 *
 * The Sites renderer is read-only: every query runs against tables
 * (`organizations`, `pages`) that are publicly readable through RLS or — for
 * unauthenticated visitors — through policies that allow anon reads of
 * published content. We therefore use the publishable (anon) key, never the
 * service-role key.
 *
 * Cookies are no-op'd because Sites does not authenticate visitors.
 */
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY env var.',
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op: Sites is anonymous, read-only.
      },
    },
  });
}
