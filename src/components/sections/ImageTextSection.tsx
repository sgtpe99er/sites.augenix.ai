import Image from 'next/image';

import type { PageSection } from '@/types/content';

import { extractString, splitParagraphs } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * Image + text — `type: "image_text"`
 *
 * Two-column layout: an image on one side, prose + optional CTA on the other.
 * Stacks vertically on mobile.
 *
 * Content shape:
 * ```
 * {
 *   "heading"?: string,
 *   "body": string,
 *   "imageUrl": string,
 *   "imageAlt"?: string,
 *   "imagePosition"?: "left" | "right",
 *   "ctaText"?: string,
 *   "ctaLink"?: string
 * }
 * ```
 */
interface ImageTextContent {
  heading?: string;
  paragraphs: string[];
  imageUrl: string;
  imageAlt: string;
  imagePosition: 'left' | 'right';
  ctaText?: string;
  ctaLink?: string;
}

function parseImageText(content: Record<string, unknown>): ImageTextContent | null {
  const body = extractString(content.body);
  const imageUrl = extractString(content.imageUrl);
  if (!body || !imageUrl) return null;
  const positionRaw = extractString(content.imagePosition);
  return {
    heading: extractString(content.heading),
    paragraphs: splitParagraphs(body),
    imageUrl,
    imageAlt: extractString(content.imageAlt) ?? '',
    imagePosition: positionRaw === 'left' ? 'left' : 'right',
    ctaText: extractString(content.ctaText),
    ctaLink: extractString(content.ctaLink),
  };
}

export function ImageTextSection({ section }: { section: PageSection }) {
  const data = parseImageText(section.content);
  if (!data) return <GenericSection section={section} />;

  const imageOrder = data.imagePosition === 'left' ? 'md:order-1' : 'md:order-2';
  const textOrder = data.imagePosition === 'left' ? 'md:order-2' : 'md:order-1';

  return (
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className="py-16"
    >
      <div className="container grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className={`order-1 ${textOrder} flex flex-col gap-6`}>
          {data.heading ? (
            <h2 className="font-serif text-3xl font-semibold leading-tight text-brand-text md:text-4xl">
              {data.heading}
            </h2>
          ) : null}
          <div className="space-y-4 text-base leading-relaxed text-brand-text/85 md:text-lg">
            {data.paragraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
          {data.ctaText && data.ctaLink ? (
            <a
              href={data.ctaLink}
              className="inline-flex w-fit items-center justify-center rounded-md bg-brand-accent px-5 py-2.5 text-base font-medium text-white shadow-sm transition hover:opacity-90"
            >
              {data.ctaText}
            </a>
          ) : null}
        </div>
        <div className={`order-2 ${imageOrder}`}>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md shadow-sm">
            <Image
              src={data.imageUrl}
              alt={data.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
