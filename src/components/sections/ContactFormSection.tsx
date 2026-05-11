import type { PageSection } from '@/types/content';

import { extractArray, extractString } from './_helpers';
import { GenericSection } from './GenericSection';

/**
 * Contact form — `type: "contact_form"`
 *
 * A heading + stacked form. Renders fully server-side as a static HTML
 * `<form>` that POSTs to the canonical `/api/contact` route handler,
 * which writes to the `contacts` table via the `submit_contact_form`
 * SECURITY DEFINER RPC. After a successful submit, the route redirects
 * back to the page with `?contact=submitted&s=<sectionId>`, which the
 * page reader reads and threads through to this component as
 * `submitted={true}` — at which point we render a thank-you panel
 * instead of the form.
 *
 * The submit endpoint is intentionally NOT overridable from the
 * section's content. Earlier iterations exposed a `submitUrl` field as
 * an escape hatch, but in practice the AI Command Center occasionally
 * invented plausible-but-wrong values (e.g. `/submit-contact`), so the
 * form would 404 on submit. Hardcoding the endpoint guarantees every
 * `contact_form` section reaches the correct backend regardless of
 * what the AI writes into the content blob.
 *
 * Content shape:
 * ```
 * {
 *   "heading"?: string,
 *   "description"?: string,
 *   "fields"?: ("name" | "email" | "phone" | "company" | "message")[],
 *   "submitLabel"?: string
 * }
 * ```
 *
 * If `fields` is omitted, the default set is `["name", "email", "message"]`.
 */
const ALLOWED_FIELDS = ['name', 'email', 'phone', 'company', 'message'] as const;
type FieldKey = (typeof ALLOWED_FIELDS)[number];

/**
 * The single canonical endpoint that every rendered `contact_form` posts
 * to. Wired up in `src/app/api/contact/route.ts`. Intentionally not
 * configurable from section content — see the component doc-comment.
 */
const CONTACT_SUBMIT_URL = '/api/contact';

const FIELD_META: Record<FieldKey, { label: string; type: string; multiline?: boolean }> = {
  name: { label: 'Name', type: 'text' },
  email: { label: 'Email', type: 'email' },
  phone: { label: 'Phone', type: 'tel' },
  company: { label: 'Company', type: 'text' },
  message: { label: 'Message', type: 'text', multiline: true },
};

interface ContactFormContent {
  heading?: string;
  description?: string;
  fields: FieldKey[];
  submitLabel: string;
}

function parseField(item: unknown): FieldKey | undefined {
  const value = extractString(item)?.toLowerCase();
  return ALLOWED_FIELDS.find((f) => f === value);
}

function parseContactForm(content: Record<string, unknown>): ContactFormContent | null {
  const requestedFields = extractArray(content.fields, parseField);
  const fields =
    requestedFields && requestedFields.length > 0
      ? Array.from(new Set(requestedFields))
      : (['name', 'email', 'message'] as FieldKey[]);
  return {
    heading: extractString(content.heading),
    description: extractString(content.description),
    fields,
    submitLabel: extractString(content.submitLabel) ?? 'Send message',
  };
}

interface ContactFormSectionProps {
  section: PageSection;
  /**
   * `true` when this exact section was just submitted (the page's
   * `?contact=submitted&s=<id>` query matched this section's id). The
   * component renders a post-submit thank-you panel instead of the form.
   */
  submitted?: boolean;
}

export function ContactFormSection({ section, submitted }: ContactFormSectionProps) {
  const data = parseContactForm(section.content);
  if (!data) return <GenericSection section={section} />;

  return (
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className="py-16"
    >
      <div className="container max-w-2xl">
        {data.heading ? (
          <h2 className="mb-3 font-serif text-3xl font-semibold leading-tight text-brand-text md:text-4xl">
            {data.heading}
          </h2>
        ) : null}
        {data.description ? (
          <p className="mb-8 text-lg leading-relaxed text-brand-text/70">{data.description}</p>
        ) : null}
        {submitted ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-md border border-brand-accent/30 bg-brand-accent/5 p-6 text-brand-text"
          >
            <p className="font-serif text-2xl font-semibold leading-tight">Thanks for reaching out.</p>
            <p className="mt-2 text-base leading-relaxed text-brand-text/70">
              We&apos;ve received your message and will be in touch soon.
            </p>
          </div>
        ) : (
          <form
            action={CONTACT_SUBMIT_URL}
            method="POST"
            className="flex flex-col gap-5 rounded-md border border-brand-text/10 bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="_section_id" value={section.id} />
            {data.fields.map((field) => {
              const meta = FIELD_META[field];
              const required = field === 'name' || field === 'email' || field === 'message';
              return (
                <label key={field} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-brand-text">
                    {meta.label}
                    {required ? <span className="ml-0.5 text-brand-accent">*</span> : null}
                  </span>
                  {meta.multiline ? (
                    <textarea
                      name={field}
                      required={required}
                      rows={5}
                      className="rounded-md border border-brand-text/15 bg-brand-background px-3 py-2 text-base text-brand-text outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
                    />
                  ) : (
                    <input
                      type={meta.type}
                      name={field}
                      required={required}
                      className="rounded-md border border-brand-text/15 bg-brand-background px-3 py-2 text-base text-brand-text outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
                    />
                  )}
                </label>
              );
            })}
            <button
              type="submit"
              className="mt-2 inline-flex w-fit items-center justify-center rounded-md bg-brand-accent px-6 py-3 text-base font-medium text-white shadow-sm transition hover:opacity-90"
            >
              {data.submitLabel}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
