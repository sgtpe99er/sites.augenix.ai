import './globals.css';

import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import { headers } from 'next/headers';

import { getOrgByDomain, type OrgLookupRow } from '@/lib/org';

/**
 * Default platform fonts, self-hosted via `next/font`.
 *
 * `next/font/google` downloads the woff2 files at build time and serves them
 * from the same origin as the app, which:
 *   - eliminates the Google Fonts DNS / TLS / fetch round-trip,
 *   - sets `<link rel="preload">` automatically (no FOUT),
 *   - applies `font-display: swap` and a fallback metric override to keep CLS
 *     close to 0 while the woff2 is still in flight.
 *
 * The CSS variables (`--font-inter`, `--font-newsreader`) feed the
 * `--brand-font-sans` / `--brand-font-serif` cascade in `globals.css`. Per-org
 * brand fonts (set as inline `style` on `<html>`) still win on specificity, so
 * a client supplying their own font stack via `brand_fonts` overrides the
 * default — the default just becomes the platform fallback.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
});

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

/**
 * Resolve the org for the incoming request. Wraps the host-header read +
 * SITES_HOST short-circuit + getOrgByDomain lookup in one place so both
 * `generateMetadata` and the layout component go through the same path. The
 * underlying lookup is cached per-host (see `src/lib/org.ts`), so calling
 * this twice in one request is free.
 */
async function resolveOrgForRequest(): Promise<OrgLookupRow | null> {
  const incomingHost = (await headers()).get('x-augenix-host');
  if (!incomingHost || incomingHost === SITES_HOST) return null;
  return getOrgByDomain(incomingHost);
}

export async function generateMetadata(): Promise<Metadata> {
  const org = await resolveOrgForRequest();

  // Default branding for the canonical Sites root and unclaimed hosts.
  if (!org) {
    return {
      title: 'Augenix Sites',
      description: 'Powered by Augenix.',
    };
  }

  // Per-org favicon. We wire the org's logo into both `icon` (the standard
  // favicon slot) and `apple-icon` (the iOS home-screen / share-sheet slot)
  // when present. Logo aspect ratios vary client-to-client, so we accept
  // whatever URL the org has uploaded and let the browser scale it; we
  // intentionally don't slot the URL into a sized rel="icon" type attribute.
  const icons = org.logo_url
    ? { icon: org.logo_url, apple: org.logo_url }
    : undefined;

  return {
    title: { default: org.name, template: `%s | ${org.name}` },
    icons,
  };
}

interface BrandStyle {
  ['--brand-primary']?: string;
  ['--brand-secondary']?: string;
  ['--brand-accent']?: string;
  ['--brand-background']?: string;
  ['--brand-text']?: string;
  ['--brand-font-sans']?: string;
  ['--brand-font-serif']?: string;
}

function buildBrandStyle(
  colors: Record<string, string> | null,
  fonts: Record<string, string> | null,
): BrandStyle {
  const style: BrandStyle = {};
  if (colors?.primary) style['--brand-primary'] = colors.primary;
  if (colors?.secondary) style['--brand-secondary'] = colors.secondary;
  if (colors?.accent) style['--brand-accent'] = colors.accent;
  if (colors?.background) style['--brand-background'] = colors.background;
  if (colors?.text) style['--brand-text'] = colors.text;
  if (fonts?.sans) style['--brand-font-sans'] = fonts.sans;
  if (fonts?.serif) style['--brand-font-serif'] = fonts.serif;
  return style;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const org = await resolveOrgForRequest();
  const style = org ? buildBrandStyle(org.brand_colors, org.brand_fonts) : {};

  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable}`}
      style={style as React.CSSProperties}
    >
      <body className="min-h-screen bg-brand-background text-brand-text antialiased">
        {children}
      </body>
    </html>
  );
}
