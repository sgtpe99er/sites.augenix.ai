import type { PageSection } from '@/types/content';

import { extractArray, extractNumber, extractObject, extractString } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * Testimonials — `type: "testimonials"`
 *
 * A heading + grid of quote cards (1-3 columns by viewport). Optional
 * star rating renders as inline ★ characters; optional avatar renders to
 * the left of the author name.
 *
 * Content shape:
 * ```
 * {
 *   "heading"?: string,
 *   "items": [
 *     {
 *       "quote": string,
 *       "author": string,
 *       "role"?: string,
 *       "rating"?: number,   // 1-5
 *       "avatar"?: string    // image URL
 *     }
 *   ]
 * }
 * ```
 */
interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  rating?: number;
  avatar?: string;
}

interface TestimonialsContent {
  heading?: string;
  items: Testimonial[];
}

function parseItem(item: unknown): Testimonial | undefined {
  const obj = extractObject(item);
  if (!obj) return undefined;
  const quote = extractString(obj.quote);
  const author = extractString(obj.author);
  if (!quote || !author) return undefined;
  const ratingRaw = extractNumber(obj.rating);
  const rating =
    ratingRaw !== undefined ? Math.max(0, Math.min(5, Math.round(ratingRaw))) : undefined;
  return {
    quote,
    author,
    role: extractString(obj.role),
    rating,
    avatar: extractString(obj.avatar),
  };
}

function parseTestimonials(content: Record<string, unknown>): TestimonialsContent | null {
  const items = extractArray(content.items, parseItem);
  if (!items || items.length === 0) return null;
  return { heading: extractString(content.heading), items };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div aria-label={`Rated ${rating} out of 5`} className="text-base text-brand-accent">
      {'★'.repeat(rating)}
      <span className="text-brand-text/20">{'★'.repeat(Math.max(0, 5 - rating))}</span>
    </div>
  );
}

export function TestimonialsSection({ section }: { section: PageSection }) {
  const data = parseTestimonials(section.content);
  if (!data) return <GenericSection section={section} />;

  const gridClass =
    data.items.length === 1
      ? 'grid-cols-1 max-w-2xl mx-auto'
      : data.items.length === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className="py-16"
    >
      <div className="container">
        {data.heading ? (
          <h2 className="mb-12 max-w-2xl font-serif text-3xl font-semibold leading-tight text-brand-text md:text-4xl">
            {data.heading}
          </h2>
        ) : null}
        <div className={`grid gap-6 ${gridClass}`}>
          {data.items.map((item, idx) => (
            <figure
              key={idx}
              className="flex h-full flex-col justify-between gap-6 rounded-md border border-brand-text/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3">
                {item.rating !== undefined ? <StarRating rating={item.rating} /> : null}
                <blockquote className="text-base leading-relaxed text-brand-text/85">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              </div>
              <figcaption className="flex items-center gap-3">
                {item.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.avatar}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : null}
                <div className="flex flex-col leading-tight">
                  <span className="font-medium text-brand-text">{item.author}</span>
                  {item.role ? (
                    <span className="text-sm text-brand-text/60">{item.role}</span>
                  ) : null}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
