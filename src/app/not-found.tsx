import { headers } from 'next/headers';
import Link from 'next/link';

import { getOrgByDomain } from '@/lib/org';

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

/**
 * Resolve the org for the not-found page. Mirrors the resolution path in
 * `src/app/layout.tsx` and `src/app/[...slug]/page.tsx`. The lookup is
 * cached per host (see `src/lib/org.ts`) so calling it here on top of the
 * layout's resolution is a cache hit, not a second DB round-trip.
 *
 * Note: when Next.js renders a 404 it re-evaluates `not-found.tsx` AND the
 * layout, so reading `headers()` here works regardless of whether the
 * `notFound()` call originated from the [...slug] page or any other route.
 */
async function getOrgForRequest() {
  const host = (await headers()).get('x-augenix-host');
  if (!host || host === SITES_HOST) return null;
  return getOrgByDomain(host);
}

export default async function NotFound() {
  const org = await getOrgForRequest();
  const orgName = org?.name ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-24 text-brand-text">
      <p className="text-xs uppercase tracking-[0.2em] text-brand-text/50">404</p>
      <h1 className="font-serif text-4xl leading-tight md:text-5xl">Page not found</h1>
      <p className="text-base leading-relaxed text-brand-text/70">
        {orgName
          ? `We couldn't find that page on ${orgName}.`
          : "We couldn't find that page on this site."}
      </p>
      <div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-brand-accent px-5 py-2.5 text-base font-medium text-white shadow-sm transition hover:opacity-90"
        >
          {orgName ? `Back to ${orgName}` : 'Back to home'}
        </Link>
      </div>
    </main>
  );
}
