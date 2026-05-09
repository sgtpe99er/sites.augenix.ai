import type { PageSection } from '@/types/content';

import { extractArray, extractObject, extractString } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * Multi-column grid — `type: "multi_column"`
 *
 * A heading + responsive grid of feature/benefit cards. Column count is
 * derived from `columns.length` (1, 2, 3, or 4).
 *
 * Content shape:
 * ```
 * {
 *   "heading"?: string,
 *   "subheading"?: string,
 *   "columns": [
 *     { "title": string, "description": string, "icon"?: string }
 *   ]
 * }
 * ```
 *
 * `icon` is rendered as a single emoji or short character if provided; SVG
 * sprite support is intentionally out of scope for this scaffold.
 */
interface ColumnItem {
  title: string;
  description: string;
  icon?: string;
}

interface MultiColumnContent {
  heading?: string;
  subheading?: string;
  columns: ColumnItem[];
}

function parseColumn(item: unknown): ColumnItem | undefined {
  const obj = extractObject(item);
  if (!obj) return undefined;
  const title = extractString(obj.title);
  const description = extractString(obj.description);
  if (!title || !description) return undefined;
  return { title, description, icon: extractString(obj.icon) };
}

function parseMultiColumn(content: Record<string, unknown>): MultiColumnContent | null {
  const columns = extractArray(content.columns, parseColumn);
  if (!columns || columns.length === 0) return null;
  return {
    heading: extractString(content.heading),
    subheading: extractString(content.subheading),
    columns,
  };
}

function gridClassFor(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2';
  if (count === 3) return 'grid-cols-1 md:grid-cols-3';
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
}

export function MultiColumnSection({ section }: { section: PageSection }) {
  const data = parseMultiColumn(section.content);
  if (!data) return <GenericSection section={section} />;

  return (
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className="py-16"
    >
      <div className="container">
        {data.heading ? (
          <div className="mb-12 max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold leading-tight text-brand-text md:text-4xl">
              {data.heading}
            </h2>
            {data.subheading ? (
              <p className="mt-3 text-lg leading-relaxed text-brand-text/70">{data.subheading}</p>
            ) : null}
          </div>
        ) : null}
        <div className={`grid gap-8 ${gridClassFor(data.columns.length)}`}>
          {data.columns.map((col, idx) => (
            <article key={idx} className="flex flex-col gap-3">
              {col.icon ? (
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-accent/10 text-xl text-brand-accent"
                >
                  {col.icon}
                </div>
              ) : null}
              <h3 className="text-xl font-semibold text-brand-text">{col.title}</h3>
              <p className="text-base leading-relaxed text-brand-text/75">{col.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
