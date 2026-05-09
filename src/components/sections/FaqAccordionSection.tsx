import type { PageSection } from '@/types/content';

import { extractArray, extractObject, extractString } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * FAQ accordion — `type: "faq_accordion"`
 *
 * A heading + a stack of expandable question/answer pairs. Uses native
 * `<details>` / `<summary>` for collapse/expand so the section requires
 * zero client-side JavaScript and ships fully server-rendered.
 *
 * Content shape:
 * ```
 * {
 *   "heading"?: string,
 *   "items": [{ "question": string, "answer": string }]
 * }
 * ```
 */
interface FaqItem {
  question: string;
  answer: string;
}

interface FaqContent {
  heading?: string;
  items: FaqItem[];
}

function parseItem(item: unknown): FaqItem | undefined {
  const obj = extractObject(item);
  if (!obj) return undefined;
  const question = extractString(obj.question);
  const answer = extractString(obj.answer);
  if (!question || !answer) return undefined;
  return { question, answer };
}

function parseFaq(content: Record<string, unknown>): FaqContent | null {
  const items = extractArray(content.items, parseItem);
  if (!items || items.length === 0) return null;
  return { heading: extractString(content.heading), items };
}

export function FaqAccordionSection({ section }: { section: PageSection }) {
  const data = parseFaq(section.content);
  if (!data) return <GenericSection section={section} />;

  return (
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className="py-16"
    >
      <div className="container max-w-3xl">
        {data.heading ? (
          <h2 className="mb-10 font-serif text-3xl font-semibold leading-tight text-brand-text md:text-4xl">
            {data.heading}
          </h2>
        ) : null}
        <div className="divide-y divide-brand-text/10 border-y border-brand-text/10">
          {data.items.map((item, idx) => (
            <details key={idx} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-medium text-brand-text">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="text-2xl leading-none text-brand-text/40 transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-base leading-relaxed text-brand-text/75">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
