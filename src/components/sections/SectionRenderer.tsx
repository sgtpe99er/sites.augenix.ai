import type { PageSection } from '@/types/content';

import { GenericSection } from './GenericSection';

/**
 * Map from `section.type` (as written by the Dashboard's AI Command Center)
 * to the React component that renders it.
 *
 * This scaffold ships only the generic fallback. Pre-built section components
 * (hero, text block, FAQ, CTA, testimonials, etc. — see PRD §17) will be added
 * as separate files in `src/components/sections/` and registered here in
 * follow-up PRs.
 */
const SECTION_COMPONENTS: Record<string, React.ComponentType<{ section: PageSection }>> = {
  // Example registrations to be filled in by future PRs:
  // hero: HeroSection,
  // text_block: TextBlockSection,
  // image_text: ImageTextSection,
  // multi_column: MultiColumnSection,
  // faq_accordion: FaqAccordionSection,
  // cta_banner: CtaBannerSection,
  // testimonials: TestimonialsSection,
  // contact_form: ContactFormSection,
  // header: HeaderSection,
  // footer: FooterSection,
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
