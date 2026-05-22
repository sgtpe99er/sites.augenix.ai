import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { BlogPostRow } from '@/lib/blog';
import { getBlogPostBySlug } from '@/lib/blog';
import { getOrgByDomain, type OrgLookupRow } from '@/lib/org';

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function resolveOrg(): Promise<OrgLookupRow | null> {
  const host = ((await headers()).get('x-augenix-host') ?? SITES_HOST).toLowerCase();
  if (host === SITES_HOST) return null;
  return getOrgByDomain(host);
}

function buildBlogPostJsonLd(post: BlogPostRow, org: OrgLookupRow, host: string) {
  const url = `https://${host}/blog/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seo_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    url,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    author: post.author_name
      ? { '@type': 'Person', name: post.author_name }
      : { '@type': 'Organization', name: org.name },
    publisher: {
      '@type': 'Organization',
      name: org.name,
      ...(org.logo_url ? { logo: { '@type': 'ImageObject', url: org.logo_url } } : {}),
    },
    ...(post.featured_image_url
      ? {
          image: {
            '@type': 'ImageObject',
            url: post.featured_image_url,
            ...(post.featured_image_width ? { width: post.featured_image_width } : {}),
            ...(post.featured_image_height ? { height: post.featured_image_height } : {}),
          },
        }
      : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = (await params).slug;
  const org = await resolveOrg();
  if (!org) return {};

  const host = ((await headers()).get('x-augenix-host') ?? SITES_HOST).toLowerCase();
  const post = await getBlogPostBySlug(org.id, slug);
  if (!post) return { title: org.name };

  const title = post.seo_title ?? post.title;
  const description = post.meta_description ?? post.excerpt ?? undefined;
  const url = `https://${host}/blog/${post.slug}`;

  const ogImage = post.og_image ?? post.featured_image_url ?? org.logo_url ?? undefined;
  const ogTitle = post.og_title ?? title;
  const ogDescription = post.og_description ?? description;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: ogTitle,
      description: ogDescription,
      siteName: org.name,
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: post.og_image_alt ?? post.featured_image_alt ?? title,
              ...(post.featured_image_width ? { width: post.featured_image_width } : {}),
              ...(post.featured_image_height ? { height: post.featured_image_height } : {}),
            },
          ]
        : undefined,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: post.author_name ? [post.author_name] : undefined,
      tags: post.tags ?? undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const slug = (await params).slug;
  const org = await resolveOrg();
  if (!org) notFound();

  const host = ((await headers()).get('x-augenix-host') ?? SITES_HOST).toLowerCase();
  const post = await getBlogPostBySlug(org.id, slug);
  if (!post) notFound();

  const jsonLd = buildBlogPostJsonLd(post, org, host);

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <header className="mb-10">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1 text-sm text-brand-text/60 hover:text-brand-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            Back to Blog
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-sm text-brand-text/60">
            {post.category && (
              <span className="rounded-full bg-brand-primary/10 px-3 py-0.5 text-xs font-medium text-brand-primary">
                {post.category}
              </span>
            )}
            {date && <time dateTime={post.published_at!}>{date}</time>}
            {post.reading_time_minutes && (
              <span>{post.reading_time_minutes} min read</span>
            )}
          </div>

          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-brand-text md:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {post.author_name && (
            <p className="mt-4 text-brand-text/60">By {post.author_name}</p>
          )}

          {post.featured_image_url && (
            <div className="mt-8 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.featured_image_url}
                alt={post.featured_image_alt ?? post.title}
                width={post.featured_image_width ?? undefined}
                height={post.featured_image_height ?? undefined}
                className="w-full object-cover"
              />
            </div>
          )}
        </header>

        {post.body_html ? (
          <div
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-brand-text prose-p:text-brand-text/80 prose-a:text-brand-primary prose-strong:text-brand-text prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.body_html }}
          />
        ) : (
          <p className="text-brand-text/60">This post has no content yet.</p>
        )}

        {post.tags && post.tags.length > 0 && (
          <footer className="mt-12 border-t border-brand-text/10 pt-6">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-text/5 px-3 py-1 text-sm text-brand-text/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </footer>
        )}

        <nav className="mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            All posts
          </Link>
        </nav>
      </article>
    </>
  );
}
