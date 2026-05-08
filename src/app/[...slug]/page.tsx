import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { getOrgByDomain } from '@/lib/org';
import { getPublishedPage } from '@/lib/pages';

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

interface PageProps {
  params: Promise<{ slug?: string[] }>;
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

async function resolveOrgFromHeaders(): Promise<{ orgId: string; orgName: string } | null> {
  const host = (await headers()).get('x-augenix-host');
  if (!host || host === SITES_HOST) return null;

  const org = await getOrgByDomain(host);
  if (!org) return null;

  return { orgId: org.id, orgName: org.name };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = slugFromParams(await params);
  const org = await resolveOrgFromHeaders();
  if (!org) return {};

  const page = await getPublishedPage(org.orgId, slug);

  return {
    title: page?.title ?? org.orgName,
    description: page?.meta_description ?? undefined,
  };
}

export default async function ClientPage({ params }: PageProps) {
  const slug = slugFromParams(await params);
  const org = await resolveOrgFromHeaders();
  if (!org) notFound();

  const page = await getPublishedPage(org.orgId, slug);
  if (!page) notFound();

  const sections = page.content?.sections ?? [];

  return (
    <main>
      <SectionRenderer sections={sections} />
    </main>
  );
}
