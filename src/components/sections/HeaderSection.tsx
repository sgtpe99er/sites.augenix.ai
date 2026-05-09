import Image from 'next/image';
import Link from 'next/link';

import type { PageSection } from '@/types/content';

import { extractArray, extractObject, extractString } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * Header — `type: "header"`
 *
 * Top-of-page chrome: logo + horizontal nav + optional CTA. Renders inside a
 * semantic `<header>` element. Pages opt in by including a `header` section
 * at the top of their `content` array; pages without one render no
 * header at all (per PRD §17 we don't impose implicit chrome).
 *
 * Content shape:
 * ```
 * {
 *   "logo"?: { "url": string, "alt"?: string },
 *   "siteName"?: string,
 *   "navLinks"?: [{ "label": string, "href": string }],
 *   "cta"?: { "label": string, "href": string },
 *   "sticky"?: boolean
 * }
 * ```
 */
interface NavLink {
  label: string;
  href: string;
}

interface HeaderContent {
  logo?: { url: string; alt: string };
  siteName?: string;
  navLinks: NavLink[];
  cta?: NavLink;
  sticky: boolean;
}

function parseLink(item: unknown): NavLink | undefined {
  const obj = extractObject(item);
  if (!obj) return undefined;
  const label = extractString(obj.label);
  const href = extractString(obj.href);
  if (!label || !href) return undefined;
  return { label, href };
}

function parseHeader(content: Record<string, unknown>): HeaderContent | null {
  const logoObj = extractObject(content.logo);
  const logoUrl = logoObj ? extractString(logoObj.url) : undefined;
  const logo = logoUrl
    ? { url: logoUrl, alt: extractString(logoObj!.alt) ?? '' }
    : undefined;

  const siteName = extractString(content.siteName);
  const navLinks = extractArray(content.navLinks, parseLink) ?? [];
  const ctaObj = extractObject(content.cta);
  const ctaLabel = ctaObj ? extractString(ctaObj.label) : undefined;
  const ctaHref = ctaObj ? extractString(ctaObj.href) : undefined;
  const cta = ctaLabel && ctaHref ? { label: ctaLabel, href: ctaHref } : undefined;
  const sticky = content.sticky === true;

  // A header with neither logo nor sitename nor any nav links has nothing to
  // render — fall back so we don't emit an empty bar.
  if (!logo && !siteName && navLinks.length === 0 && !cta) return null;

  return { logo, siteName, navLinks, cta, sticky };
}

export function HeaderSection({ section }: { section: PageSection }) {
  const data = parseHeader(section.content);
  if (!data) return <GenericSection section={section} />;

  const stickyClass = data.sticky ? 'sticky top-0 z-40' : '';

  return (
    <header
      data-section-id={section.id}
      data-section-type={section.type}
      className={`${stickyClass} w-full border-b border-brand-text/10 bg-brand-background/95 backdrop-blur supports-[backdrop-filter]:bg-brand-background/80`}
    >
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 text-brand-text">
          {data.logo ? (
            <Image
              src={data.logo.url}
              alt={data.logo.alt}
              width={32}
              height={32}
              sizes="32px"
              className="h-8 w-8 object-contain"
            />
          ) : null}
          {data.siteName ? (
            <span className="font-serif text-lg font-semibold tracking-tight">
              {data.siteName}
            </span>
          ) : null}
        </Link>
        {(data.navLinks.length > 0 || data.cta) && (
          <nav className="flex items-center gap-6">
            {data.navLinks.map((link) => (
              <a
                key={`${link.label}:${link.href}`}
                href={link.href}
                className="hidden text-sm font-medium text-brand-text/80 transition hover:text-brand-text md:inline-block"
              >
                {link.label}
              </a>
            ))}
            {data.cta ? (
              <a
                href={data.cta.href}
                className="inline-flex items-center justify-center rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              >
                {data.cta.label}
              </a>
            ) : null}
          </nav>
        )}
      </div>
    </header>
  );
}
