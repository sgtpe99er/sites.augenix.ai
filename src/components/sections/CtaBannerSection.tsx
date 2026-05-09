import type { PageSection } from '@/types/content';

import { extractString } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * CTA banner — `type: "cta_banner"`
 *
 * Full-width band with centered headline + button. Used to anchor
 * conversion-focused calls to action between content sections.
 *
 * Content shape (all four required):
 * ```
 * {
 *   "headline": string,
 *   "ctaText": string,
 *   "ctaLink": string,
 *   "subheadline"?: string,
 *   "variant"?: "primary" | "accent"
 * }
 * ```
 *
 * `variant` controls the band's background — `primary` (the org's primary
 * brand color, default) or `accent` (the org's accent color).
 */
interface CtaBannerContent {
  headline: string;
  subheadline?: string;
  ctaText: string;
  ctaLink: string;
  variant: 'primary' | 'accent';
}

function parseCtaBanner(content: Record<string, unknown>): CtaBannerContent | null {
  const headline = extractString(content.headline);
  const ctaText = extractString(content.ctaText);
  const ctaLink = extractString(content.ctaLink);
  if (!headline || !ctaText || !ctaLink) return null;
  const variantRaw = extractString(content.variant);
  return {
    headline,
    subheadline: extractString(content.subheadline),
    ctaText,
    ctaLink,
    variant: variantRaw === 'accent' ? 'accent' : 'primary',
  };
}

export function CtaBannerSection({ section }: { section: PageSection }) {
  const data = parseCtaBanner(section.content);
  if (!data) return <GenericSection section={section} />;

  const bandClass = data.variant === 'accent' ? 'bg-brand-accent' : 'bg-brand-primary';
  const buttonClass =
    data.variant === 'accent'
      ? 'bg-white text-brand-accent hover:bg-white/95'
      : 'bg-brand-accent text-white hover:opacity-90';

  return (
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className={`${bandClass} py-16`}
    >
      <div className="container flex flex-col items-center gap-6 text-center">
        <h2 className="font-serif text-3xl font-semibold leading-tight text-white md:text-4xl">
          {data.headline}
        </h2>
        {data.subheadline ? (
          <p className="max-w-2xl text-lg leading-relaxed text-white/85">{data.subheadline}</p>
        ) : null}
        <a
          href={data.ctaLink}
          className={`inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium shadow-sm transition ${buttonClass}`}
        >
          {data.ctaText}
        </a>
      </div>
    </section>
  );
}
