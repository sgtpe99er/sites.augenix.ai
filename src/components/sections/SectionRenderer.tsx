import type { PageSection } from '@/types/content';

import { ContactFormSection } from './ContactFormSection';
import { CtaBannerSection } from './CtaBannerSection';
import { FaqAccordionSection } from './FaqAccordionSection';
import { GenericSection } from './GenericSection';
import { HeroSection } from './HeroSection';
import { ImageTextSection } from './ImageTextSection';
import { MultiColumnSection } from './MultiColumnSection';
import { TestimonialsSection } from './TestimonialsSection';
import { TextBlockSection } from './TextBlockSection';

/**
 * Map from `section.type` (as written by the Dashboard's AI Command Center)
 * to the React component that renders it.
 *
 * The 8 registered types below are the minimum viable set called out in
 * PRD §17 ("Sites section component library"). The Dashboard's AI prompt
 * mirrors the per-type content shapes documented in this repo's README.md
 * so the AI knows which keys each renderer expects. Any section whose
 * `type` is not in this map (or whose `content` shape fails the typed
 * parser) renders via `GenericSection`.
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
};

export function SectionRenderer({ sections }: { sections: PageSection[] }) {
  return (
    <>
      {sections.map((section) => {
        const Component = SECTION_COMPONENTS[section.type] ?? GenericSection;
        return <Component key={section.id} section={section} />;
      })}
    </>
  );
}
