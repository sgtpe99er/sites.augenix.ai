import { headers } from 'next/headers';

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

/**
 * Default landing page for the canonical Sites URL (`sites.augenix.ai`).
 *
 * A visitor reaches this page only when their `Host` header matches
 * `sites.augenix.ai`. Any client custom domain pointed at this Vercel project
 * is handled by `src/app/[...slug]/page.tsx` instead — including the apex of
 * that domain, which the catch-all maps to `slug = 'homepage'`.
 *
 * Per PRD §17 (Sites is intentionally minimal), this is just an explainer
 * surface so a stray visitor / monitoring probe doesn't see a 404.
 */
export default async function RootPage() {
  const host = (await headers()).get('x-augenix-host');
  const isCanonical = host === SITES_HOST;

  // If a client custom domain has been pointed at this project but no
  // organization has claimed it yet (i.e. `organizations.custom_domain` does
  // not match), we still render this landing rather than a 404.
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
