import type { PageSection } from '@/types/content';

import { extractArray, extractObject, extractString } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * Footer — `type: "footer"`
 *
 * Bottom-of-page chrome: optional link columns + tagline + copyright +
 * optional social links. Renders inside a semantic `<footer>` element.
 * Pages opt in by including a `footer` section at the bottom of their
 * `content` array; pages without one render no footer (per PRD §17
 * we don't impose implicit chrome).
 *
 * Content shape:
 * ```
 * {
 *   "tagline"?: string,
 *   "columns"?: [
 *     { "heading": string, "links": [{ "label": string, "href": string }] }
 *   ],
 *   "social"?: [{ "platform": string, "href": string }],
 *   "copyright"?: string
 * }
 * ```
 */
interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: string;
  href: string;
}

interface FooterContent {
  tagline?: string;
  columns: FooterColumn[];
  social: SocialLink[];
  copyright?: string;
}

function parseLink(item: unknown): FooterLink | undefined {
  const obj = extractObject(item);
  if (!obj) return undefined;
  const label = extractString(obj.label);
  const href = extractString(obj.href);
  if (!label || !href) return undefined;
  return { label, href };
}

function parseColumn(item: unknown): FooterColumn | undefined {
  const obj = extractObject(item);
  if (!obj) return undefined;
  const heading = extractString(obj.heading);
  const links = extractArray(obj.links, parseLink) ?? [];
  if (!heading || links.length === 0) return undefined;
  return { heading, links };
}

function parseSocial(item: unknown): SocialLink | undefined {
  const obj = extractObject(item);
  if (!obj) return undefined;
  const platform = extractString(obj.platform);
  const href = extractString(obj.href);
  if (!platform || !href) return undefined;
  return { platform, href };
}

function parseFooter(content: Record<string, unknown>): FooterContent | null {
  const tagline = extractString(content.tagline);
  const columns = extractArray(content.columns, parseColumn) ?? [];
  const social = extractArray(content.social, parseSocial) ?? [];
  const copyright = extractString(content.copyright);

  if (!tagline && columns.length === 0 && social.length === 0 && !copyright) {
    return null;
  }

  return { tagline, columns, social, copyright };
}

export function FooterSection({ section }: { section: PageSection }) {
  const data = parseFooter(section.content);
  if (!data) return <GenericSection section={section} />;

  return (
    <footer
      data-section-id={section.id}
      data-section-type={section.type}
      className="border-t border-brand-text/10 bg-brand-background/60 py-12"
    >
      <div className="container flex flex-col gap-10">
        {(data.tagline || data.columns.length > 0) && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {data.tagline ? (
              <p className="md:col-span-1 text-sm leading-relaxed text-brand-text/70">
                {data.tagline}
              </p>
            ) : null}
            {data.columns.map((col, idx) => (
              <div key={`${col.heading}:${idx}`} className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-text">
                  {col.heading}
                </h3>
                <ul className="flex flex-col gap-2 text-sm text-brand-text/70">
                  {col.links.map((link) => (
                    <li key={`${link.label}:${link.href}`}>
                      <a
                        href={link.href}
                        className="transition hover:text-brand-text"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {(data.social.length > 0 || data.copyright) && (
          <div className="flex flex-col items-start justify-between gap-4 border-t border-brand-text/10 pt-6 text-xs text-brand-text/60 md:flex-row md:items-center">
            {data.copyright ? <span>{data.copyright}</span> : <span />}
            {data.social.length > 0 ? (
              <ul className="flex items-center gap-4">
                {data.social.map((s) => (
                  <li key={`${s.platform}:${s.href}`}>
                    <a
                      href={s.href}
                      className="transition hover:text-brand-text"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {s.platform}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </footer>
  );
}
