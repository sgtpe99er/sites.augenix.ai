import type { PageSection } from '@/types/content';

import { extractString, splitParagraphs } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * Text block — `type: "text_block"`
 *
 * Plain prose section with an optional heading. The `body` field can contain
 * `\n\n`-separated paragraphs and is rendered as a stack of <p> elements.
 *
 * Content shape:
 * ```
 * {
 *   "heading"?: string,
 *   "body": string
 * }
 * ```
 */
interface TextBlockContent {
  heading?: string;
  paragraphs: string[];
}

function parseTextBlock(content: Record<string, unknown>): TextBlockContent | null {
  const body = extractString(content.body);
  if (!body) return null;
  return {
    heading: extractString(content.heading),
    paragraphs: splitParagraphs(body),
  };
}

export function TextBlockSection({ section }: { section: PageSection }) {
  const data = parseTextBlock(section.content);
  if (!data) return <GenericSection section={section} />;

  return (
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className="py-16"
    >
      <div className="container max-w-3xl">
        {data.heading ? (
          <h2 className="mb-6 font-serif text-3xl font-semibold leading-tight text-brand-text md:text-4xl">
            {data.heading}
          </h2>
        ) : null}
        <div className="space-y-4 text-lg leading-relaxed text-brand-text/85">
          {data.paragraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
