import type { PageSection } from '@/types/content';

import { extractString } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * Hero — `type: "hero"`
 *
 * Top-of-page banner with a large headline, optional supporting copy, optional
 * CTA, and optional background image. Rendered server-side.
 *
 * Content shape (every field except `headline` is optional):
 * ```
 * {
 *   "headline": string,
 *   "subheadline"?: string,
 *   "ctaText"?: string,
 *   "ctaLink"?: string,
 *   "backgroundImage"?: string,
 *   "alignment"?: "left" | "center"
 * }
 * ```
 */
interface HeroContent {
  headline: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  alignment: 'left' | 'center';
}

function parseHero(content: Record<string, unknown>): HeroContent | null {
  const headline = extractString(content.headline);
  if (!headline) return null;
  const alignmentRaw = extractString(content.alignment);
  const alignment: 'left' | 'center' = alignmentRaw === 'left' ? 'left' : 'center';
  return {
    headline,
    subheadline: extractString(content.subheadline),
    ctaText: extractString(content.ctaText),
    ctaLink: extractString(content.ctaLink),
    backgroundImage: extractString(content.backgroundImage),
    alignment,
  };
}

export function HeroSection({ section }: { section: PageSection }) {
  const data = parseHero(section.content);
  if (!data) return <GenericSection section={section} />;

  const align = data.alignment === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className="relative isolate overflow-hidden bg-brand-primary"
    >
      {data.backgroundImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.backgroundImage}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 to-black/60" />
        </>
      ) : null}

      <div className={`container flex min-h-[60vh] flex-col justify-center gap-6 py-24 ${align}`}>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-white md:text-6xl">
          {data.headline}
        </h1>
        {data.subheadline ? (
          <p className="max-w-3xl text-lg leading-relaxed text-white/85 md:text-xl">
            {data.subheadline}
          </p>
        ) : null}
        {data.ctaText && data.ctaLink ? (
          <a
            href={data.ctaLink}
            className="inline-flex w-fit items-center justify-center rounded-md bg-brand-accent px-6 py-3 text-base font-medium text-white shadow-sm transition hover:opacity-90"
          >
            {data.ctaText}
          </a>
        ) : null}
      </div>
    </section>
  );
}
