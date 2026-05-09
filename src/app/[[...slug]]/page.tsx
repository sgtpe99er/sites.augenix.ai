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

type Resolution =
  | { kind: 'canonical'; host: string }
  | { kind: 'org'; host: string; org: OrgLookupRow }
  | { kind: 'unclaimed'; host: string };

async function resolveFromHeaders(): Promise<Resolution> {
  const host = ((await headers()).get('x-augenix-host') ?? SITES_HOST).toLowerCase();
  if (host === SITES_HOST) return { kind: 'canonical', host };

  const org = await getOrgByDomain(host);
  if (!org) return { kind: 'unclaimed', host };

  return { kind: 'org', host, org };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = slugFromParams(await params);
  const resolved = await resolveFromHeaders();
  if (resolved.kind !== 'org') return {};

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

/**
 * Static explainer surface served when the catch-all matches `/` on either
 * the canonical Sites URL (`sites.augenix.ai`) or a custom domain that has
 * been pointed at this Vercel project but is not yet claimed by an
 * organization. Lives here (rather than a separate `app/page.tsx`) because
 * Next.js does not allow a root `page.tsx` to coexist with an optional
 * catch-all route — the optional catch-all owns `/`.
 */
function CanonicalLanding({ isCanonical }: { isCanonical: boolean }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-24 text-brand-text">
      <p className="text-xs uppercase tracking-[0.2em] text-black/50">Augenix Sites</p>
      <h1 className="font-serif text-4xl leading-tight md:text-5xl">
        This is the Augenix Sites renderer.
      </h1>
      <p className="text-lg leading-relaxed text-black/70">
        {isCanonical
          ? 'You are visiting the canonical service URL. Augenix Sites serves customer websites on their own custom domains; nothing is hosted at this address directly.'
          : 'This domain is pointed at Augenix Sites but is not yet linked to an organization. The site owner can claim it from the Augenix dashboard.'}
      </p>
      <p className="text-sm text-black/60">
        Manage your site at{' '}
        <a href="https://app.augenix.ai" className="font-medium underline underline-offset-4">
          app.augenix.ai
        </a>
        .
      </p>
    </main>
  );
}

export default async function ClientPage({ params, searchParams }: PageProps) {
  const slug = slugFromParams(await params);
  const resolved = await resolveFromHeaders();

  // Canonical service URL or unclaimed pass-through host: render the
  // explainer page rather than 404-ing. Sub-paths still 404 since the
  // landing only makes sense at `/`.
  if (resolved.kind !== 'org') {
    if (slug !== 'homepage') notFound();
    return <CanonicalLanding isCanonical={resolved.kind === 'canonical'} />;
  }

  const page = await getPublishedPage(resolved.org.id, slug);
  if (!page) notFound();

  const sections = page.content ?? [];

  // Resolve a "just submitted" section id from the query so the matching
  // `ContactFormSection` flips to its thank-you panel. We only honor the
  // `s` param when `contact=submitted` is also present so a stray `?s=...`
  // can't be smuggled in to suppress a real form.
  const sp = (await searchParams) ?? {};
  const submittedRaw = sp.contact === 'submitted' ? sp.s : undefined;
  const submittedSectionId = typeof submittedRaw === 'string' ? submittedRaw : undefined;

  return <SectionRenderer sections={sections} submittedSectionId={submittedSectionId} />;
}
