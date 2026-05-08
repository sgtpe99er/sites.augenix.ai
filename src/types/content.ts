/**
 * Type definitions mirroring the freeform `pages.content` JSONB column.
 *
 * Per PRD §7.1, page content is a freeform JSON array of sections. There is no
 * fixed schema for section types — the AI in the Dashboard's Command Center
 * decides the shape of each section. The Sites renderer iterates the array and
 * matches each section's `type` to a component. Unknown types fall back to a
 * generic content block.
 */

export type SectionContent = Record<string, unknown>;

export interface PageSection {
  /** Stable identifier for the section within the page (e.g. `"s1"`). */
  id: string;
  /**
   * Section type used by the renderer to look up a component (e.g. `"hero"`,
   * `"three_column_features"`). Unknown types render as a generic block.
   */
  type: string;
  /** Freeform content payload. Shape depends on `type`. */
  content: SectionContent;
}

export interface PageContent {
  sections: PageSection[];
}

export interface OrganizationBrand {
  name: string;
  logo_url: string | null;
  brand_colors: Record<string, string> | null;
  brand_fonts: Record<string, string> | null;
}

export interface PageRecord {
  id: string;
  org_id: string;
  slug: string;
  title: string | null;
  content: PageContent | null;
  meta_description: string | null;
  is_published: boolean;
}
