import type { PageSection } from '@/types/content';

/**
 * Fallback renderer for any section whose `type` is not yet implemented in the
 * Sites component map.
 *
 * Per PRD §7.1, the AI in the Dashboard's Command Center can invent any
 * section type it deems appropriate. The renderer must degrade gracefully —
 * showing the structured content as a plain block of text and key/value pairs
 * — rather than 500'ing or rendering nothing.
 *
 * As we add real component implementations (hero, FAQ, CTA, etc.) under
 * `src/components/sections/`, register them in the `SectionRenderer` map so
 * known types render as designed and only truly novel types fall through here.
 */
export function GenericSection({ section }: { section: PageSection }) {
  const entries = Object.entries(section.content ?? {});

  return (
    <section
      data-section-id={section.id}
      data-section-type={section.type}
      className="border-y border-black/5 py-12"
    >
      <div className="container">
        <p className="mb-4 text-xs uppercase tracking-widest text-black/50">{section.type}</p>
        <div className="space-y-3 text-base leading-relaxed text-brand-text">
          {entries.length === 0 ? (
            <p className="italic text-black/50">(empty section)</p>
          ) : (
            entries.map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wider text-black/40">
                  {key}
                </span>
                <pre className="whitespace-pre-wrap break-words font-sans text-base">
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
