import { getPageFaqs } from '@/lib/faqs';
import type { PageSection } from '@/types/content';

import { extractArray, extractObject, extractString } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * FAQ accordion — `type: "faq_accordion"`
 *
 * Supports two content modes:
 *
 * **Inline** (original behavior):
 * ```
 * { "heading"?: string, "items": [{ "question": string, "answer": string }] }
 * ```
 *
 * **Database** (fetches from `get_page_faqs` RPC):
 * ```
 * { "heading"?: string, "source": "database" }
 * ```
 *
 * When `source` is `"database"`, the component fetches published FAQs from the
 * Augenix Supabase for the current org/page and renders them with the same
 * visual style + Schema.org FAQPage JSON-LD.
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

function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function FaqAccordionUI({
  sectionId,
  heading,
  items,
}: {
  sectionId: string;
  heading?: string;
  items: FaqItem[];
}) {
  return (
    <section
      data-section-id={sectionId}
      data-section-type="faq_accordion"
      className="py-16"
    >
      <div className="container max-w-3xl">
        {heading ? (
          <h2 className="mb-10 font-serif text-3xl font-semibold leading-tight text-brand-text md:text-4xl">
            {heading}
          </h2>
        ) : null}
        <div className="divide-y divide-brand-text/10 border-y border-brand-text/10">
          {items.map((item, idx) => (
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
      <FaqJsonLd items={items} />
    </section>
  );
}

interface FaqAccordionSectionProps {
  section: PageSection;
  orgId?: string;
  pageSlug?: string;
}

export async function FaqAccordionSection({ section, orgId, pageSlug }: FaqAccordionSectionProps) {
  const source = extractString(section.content.source);

  // Database mode: fetch from get_page_faqs RPC
  if (source === 'database' && orgId && pageSlug) {
    const faqs = await getPageFaqs(orgId, pageSlug);
    if (faqs.length === 0) return null;

    const heading = extractString(section.content.heading);
    const items: FaqItem[] = faqs.map((f) => ({
      question: f.question,
      answer: f.answer,
    }));

    return <FaqAccordionUI sectionId={section.id} heading={heading ?? undefined} items={items} />;
  }

  // Inline mode: parse items from section content
  const data = parseFaq(section.content);
  if (!data) return <GenericSection section={section} />;

  return <FaqAccordionUI sectionId={section.id} heading={data.heading} items={data.items} />;
}
