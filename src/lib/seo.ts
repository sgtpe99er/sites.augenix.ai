import 'server-only';

import type { Metadata } from 'next';

import type { PageRecord } from '@/types/content';

import type { OrgLookupRow } from './org';

/**
 * Walk a page's section list and return the first plausibly-renderable image
 * URL we can use as `og:image` / `twitter:image`. We check section types in
 * priority order — hero `backgroundImage` first because it's typically the
 * splashy above-the-fold visual, then `image_text.imageUrl`, and finally
 * `testimonials[].avatar` as a last resort.
 *
 * Returns `null` if no section has a usable string URL — the caller falls
 * back to the org's `logo_url`. Defensive against malformed AI-generated
 * content: every field access is `unknown`-typed and runtime-checked rather
 * than trusted via cast.
 */
function pickPageImage(page: PageRecord): string | null {
  const sections = page.content?.sections;
  if (!sections || sections.length === 0) return null;

  for (const section of sections) {
    const c = section.content;
    if (!c || typeof c !== 'object') continue;

    if (section.type === 'hero') {
      const bg = (c as { backgroundImage?: unknown }).backgroundImage;
      if (typeof bg === 'string' && bg.length > 0) return bg;
    }

    if (section.type === 'image_text') {
      const img = (c as { imageUrl?: unknown }).imageUrl;
      if (typeof img === 'string' && img.length > 0) return img;
    }
  }

  // Second pass: testimonials avatars are a weaker signal but better than
  // nothing for pages that have no hero / image_text. Kept as a separate
  // pass so we always prefer a hero image when one exists.
  for (const section of sections) {
    if (section.type !== 'testimonials') continue;
    const items = (section.content as { items?: unknown }).items;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const avatar = (item as { avatar?: unknown }).avatar;
      if (typeof avatar === 'string' && avatar.length > 0) return avatar;
    }
  }

  return null;
}

/**
 * Construct a fully-qualified canonical URL for the given host + slug.
 *
 * The Sites renderer doesn't actually know whether visitors are reaching it
 * over HTTPS or HTTP at the layer where we generate metadata — but in
 * production every claimed custom domain is served over HTTPS via Vercel,
 * and search engines treat HTTPS canonicals as the source of truth. We
 * always emit `https://`.
 */
function buildCanonicalUrl(host: string, slug: string): string {
  const path = slug === 'homepage' ? '/' : `/${slug}`;
  return `https://${host}${path}`;
}

interface BuildPageMetadataInput {
  host: string;
  slug: string;
  org: OrgLookupRow;
  page: PageRecord;
}

/**
 * Compose a `Metadata` object with the full Open Graph / Twitter Card /
 * canonical URL set for a published page.
 *
 * Falls back gracefully when fields are missing:
 *   - `title` falls back to the org's `name`
 *   - `description` is omitted entirely if `meta_description` is null
 *   - `og:image` falls back to `org.logo_url`, then omitted entirely
 *   - `twitter:card` switches between `summary_large_image` and `summary`
 *     based on whether an image is available
 *
 * Next.js handles emitting the actual `<meta>` tags — we only describe the
 * intent here. See:
 *   - https://nextjs.org/docs/app/building-your-application/optimizing/metadata
 *   - https://ogp.me/
 *   - https://developer.x.com/en/docs/x-for-websites/cards/overview/markup
 */
export function buildPageMetadata({ host, slug, org, page }: BuildPageMetadataInput): Metadata {
  const title = page.title ?? org.name;
  const description = page.meta_description ?? undefined;
  const url = buildCanonicalUrl(host, slug);
  const imageUrl = pickPageImage(page) ?? org.logo_url ?? undefined;

  const meta: Metadata = {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: org.name,
      images: imageUrl ? [{ url: imageUrl, alt: title }] : undefined,
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };

  return meta;
}
