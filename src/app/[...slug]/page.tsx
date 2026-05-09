import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { getOrgByDomain, type OrgLookupRow } from '@/lib/org';
import { getPublishedPage } from '@/lib/pages';
import { buildPageMetadata } from '@/lib/seo';

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

interface PageProps {
  params: Promise<{ slug?: string[] }>;
  /**
   * Standard Next.js search-param prop. We only inspect `?contact=submitted`
   * + `?s=<sectionId>`, which the `/api/contact` route handler appends on a
   * successful form submit so the matching `ContactFormSection` can render
   * its thank-you panel.
   */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Map a URL path under a client custom domain to a row in `pages.slug`.
 *
 * - `/` (catch-all params is empty) → `homepage`
 * - `/about` → `about`
 * - `/services/plumbing` → `services/plumbing`
 *
 * The convention matches what the Dashboard's Command Center seeds and
 * surfaces in its page selector dropdown.
 */
function slugFromParams(params: { slug?: string[] }): string {
  if (!params.slug || params.slug.length === 0) return 'homepage';
  return params.slug.join('/');
}

async function resolveOrgFromHeaders(): Promise<{ host: string; org: OrgLookupRow } | null> {
  const host = (await headers()).get('x-augenix-host');
  if (!host || host === SITES_HOST) return null;

  const org = await getOrgByDomain(host);
  if (!org) return null;

  return { host, org };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = slugFromParams(await params);
  const resolved = await resolveOrgFromHeaders();
  if (!resolved) return {};

  const page = await getPublishedPage(resolved.org.id, slug);

  // No published page at this slug — emit just a title so search engines
  // / social previews don't show a blank string. The page itself will 404.
  if (!page) {
    return { title: resolved.org.name };
  }

  return buildPageMetadata({
    host: resolved.host,
    slug,
    org: resolved.org,
    page,
  });
}

export default async function ClientPage({ params, searchParams }: PageProps) {
  const slug = slugFromParams(await params);
  const resolved = await resolveOrgFromHeaders();
  if (!resolved) notFound();

  const page = await getPublishedPage(resolved.org.id, slug);
  if (!page) notFound();

  const sections = page.content?.sections ?? [];

  // Resolve a "just submitted" section id from the query so the matching
  // `ContactFormSection` flips to its thank-you panel. We only honor the
  // `s` param when `contact=submitted` is also present so a stray `?s=...`
  // can't be smuggled in to suppress a real form.
  const sp = (await searchParams) ?? {};
  const submittedRaw = sp.contact === 'submitted' ? sp.s : undefined;
  const submittedSectionId = typeof submittedRaw === 'string' ? submittedRaw : undefined;

  return <SectionRenderer sections={sections} submittedSectionId={submittedSectionId} />;
}
