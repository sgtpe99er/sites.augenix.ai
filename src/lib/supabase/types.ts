/**
 * Minimal database type definitions for the Sites project.
 *
 * The Dashboard project (`app.augenix.ai`) owns the full generated Supabase
 * types via `supabase gen types`. The Sites project only reads three tables —
 * `organizations`, `pages`, and (via Storage URLs) `media` — so we keep a
 * narrow hand-written `Database` type here to avoid shipping the entire schema.
 *
 * If a column added to one of these tables in the Dashboard repo is needed
 * here, mirror it in this file.
 */

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  brand_colors: Record<string, string> | null;
  brand_fonts: Record<string, string> | null;
  brand_voice: string | null;
  industry: string | null;
  plan: string | null;
};

// `pages.content` is stored as a bare JSONB array of sections (NOT wrapped
// in a `{ sections: [...] }` object). See `src/types/content.ts` for the
// authoritative convention. We keep this DB-row type intentionally narrow
// — the renderer's strict types live next to the renderer.
type PageContentJson = Array<{
  id: string;
  type: string;
  content: Record<string, unknown>;
}>;

type PageRow = {
  id: string;
  org_id: string;
  slug: string;
  title: string | null;
  content: PageContentJson | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: OrganizationRow;
        Insert: OrganizationRow;
        Update: Partial<OrganizationRow>;
        Relationships: [];
      };
      pages: {
        Row: PageRow;
        Insert: PageRow;
        Update: Partial<PageRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_org_for_host: {
        Args: { host: string };
        Returns: Array<{
          id: string;
          name: string;
          slug: string;
          custom_domain: string | null;
          logo_url: string | null;
          brand_colors: Record<string, string> | null;
          brand_fonts: Record<string, string> | null;
          design_config: Record<string, unknown> | null;
        }>;
      };
      get_page_faqs: {
        Args: { p_org_id: string; p_page_slug: string };
        Returns: Array<{
          id: string;
          question: string;
          answer: string;
          sort_order: number;
          category: string | null;
        }>;
      };
      get_org_blog_posts: {
        Args: { p_org_id: string; p_limit?: number; p_offset?: number; p_category?: string | null };
        Returns: Array<{
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body_html: string | null;
          seo_title: string | null;
          meta_description: string | null;
          featured_image_url: string | null;
          featured_image_alt: string | null;
          featured_image_width: number | null;
          featured_image_height: number | null;
          og_title: string | null;
          og_description: string | null;
          og_image: string | null;
          og_image_alt: string | null;
          category: string | null;
          tags: string[] | null;
          author_name: string | null;
          reading_time_minutes: number | null;
          published_at: string | null;
          updated_at: string | null;
        }>;
      };
      get_blog_post_by_slug: {
        Args: { p_org_id: string; p_slug: string };
        Returns: Array<{
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body_html: string | null;
          seo_title: string | null;
          meta_description: string | null;
          featured_image_url: string | null;
          featured_image_alt: string | null;
          featured_image_width: number | null;
          featured_image_height: number | null;
          og_title: string | null;
          og_description: string | null;
          og_image: string | null;
          og_image_alt: string | null;
          category: string | null;
          tags: string[] | null;
          author_name: string | null;
          reading_time_minutes: number | null;
          published_at: string | null;
          updated_at: string | null;
        }>;
      };
      submit_contact_form: {
        Args: {
          p_host: string;
          p_name: string;
          p_email: string;
          p_phone: string | null;
          p_company: string | null;
          p_message: string | null;
        };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
