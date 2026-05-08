import './globals.css';

import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { getOrgByDomain } from '@/lib/org';

export const metadata: Metadata = {
  title: 'Augenix Sites',
  description: 'Powered by Augenix.',
};

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

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
  const incomingHost = (await headers()).get('x-augenix-host');

  // The canonical Sites URL itself is not a client domain — render with the
  // default Augenix theme. Only do the lookup when the visitor is on a
  // potentially-claimed custom domain.
  const isClientDomain = incomingHost ? incomingHost !== SITES_HOST : false;
  const org = isClientDomain ? await getOrgByDomain(incomingHost) : null;

  const style = org ? buildBrandStyle(org.brand_colors, org.brand_fonts) : {};

  return (
    <html lang="en" style={style as React.CSSProperties}>
      <body className="min-h-screen bg-brand-background text-brand-text antialiased">
        {children}
      </body>
    </html>
  );
}
