import type { PageSection } from '@/types/content';

import { ContactFormSection } from './ContactFormSection';
import { CtaBannerSection } from './CtaBannerSection';
import { FaqAccordionSection } from './FaqAccordionSection';
import { FooterSection } from './FooterSection';
import { GenericSection } from './GenericSection';
import { HeaderSection } from './HeaderSection';
import { HeroSection } from './HeroSection';
import { ImageTextSection } from './ImageTextSection';
import { MultiColumnSection } from './MultiColumnSection';
import { TestimonialsSection } from './TestimonialsSection';
import { TextBlockSection } from './TextBlockSection';

/**
 * Map from `section.type` (as written by the Dashboard's AI Command Center)
 * to the React component that renders it.
 *
 * The 10 registered types below are the minimum viable set called out in
 * PRD §17 ("Sites section component library") plus header + footer chrome
 * (PRD §17 Q5 "Option A": pages opt in to chrome by including a section
 * rather than the renderer imposing implicit chrome). The Dashboard's AI
 * prompt mirrors the per-type content shapes documented in this repo's
 * README.md so the AI knows which keys each renderer expects. Any section
 * whose `type` is not in this map (or whose `content` shape fails the typed
 * parser) renders via `GenericSection`.
 *
 * `header` and `footer` differ from the body sections in that the renderer
 * extracts the first `header` and the last `footer` from the section list
 * and emits them OUTSIDE the page's `<main>` element so the markup is
 * semantically correct. See `SectionRenderer` below.
 */
const SECTION_COMPONENTS: Record<string, React.ComponentType<{ section: PageSection }>> = {
  hero: HeroSection,
  text_block: TextBlockSection,
  image_text: ImageTextSection,
  multi_column: MultiColumnSection,
  faq_accordion: FaqAccordionSection,
  cta_banner: CtaBannerSection,
  testimonials: TestimonialsSection,
  contact_form: ContactFormSection,
  header: HeaderSection,
  footer: FooterSection,
};

function renderSection(section: PageSection) {
  const Component = SECTION_COMPONENTS[section.type] ?? GenericSection;
  return <Component key={section.id} section={section} />;
}

/**
 * Render a page's section list into semantic HTML.
 *
 * The first `header`-typed section (if any) is hoisted out of `<main>` and
 * emitted as `<header>` chrome above it; symmetrically, the last
 * `footer`-typed section (if any) is emitted as `<footer>` after `<main>`.
 * Every other section renders in document order inside `<main>`. Pages with
 * no `header`/`footer` section emit no chrome at all (per PRD §17 Q5).
 */
export function SectionRenderer({ sections }: { sections: PageSection[] }) {
  const headerIdx = sections.findIndex((s) => s.type === 'header');
  let footerIdx = -1;
  for (let i = sections.length - 1; i >= 0; i--) {
    if (sections[i].type === 'footer') {
      footerIdx = i;
      break;
    }
  }

  const headerSection = headerIdx >= 0 ? sections[headerIdx] : null;
  const footerSection = footerIdx >= 0 ? sections[footerIdx] : null;
  const bodySections = sections.filter((_, idx) => idx !== headerIdx && idx !== footerIdx);

  return (
    <>
      {headerSection ? renderSection(headerSection) : null}
      <main>{bodySections.map(renderSection)}</main>
      {footerSection ? renderSection(footerSection) : null}
    </>
  );
}
