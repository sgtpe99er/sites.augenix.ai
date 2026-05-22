import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { BlogPostRow } from '@/lib/blog';
import { getBlogPosts } from '@/lib/blog';
import { getOrgByDomain, type OrgLookupRow } from '@/lib/org';

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

async function resolveOrg(): Promise<OrgLookupRow | null> {
  const host = ((await headers()).get('x-augenix-host') ?? SITES_HOST).toLowerCase();
  if (host === SITES_HOST) return null;
  return getOrgByDomain(host);
}

export async function generateMetadata(): Promise<Metadata> {
  const org = await resolveOrg();
  if (!org) return {};

  return {
    title: 'Blog',
    description: `Latest blog posts from ${org.name}.`,
    alternates: {
      types: { 'application/rss+xml': '/blog/feed.xml' },
    },
  };
}

function PostCard({ post, orgName }: { post: BlogPostRow; orgName: string }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block">
        {post.featured_image_url && (
          <div className="mb-4 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt ?? post.title}
              width={post.featured_image_width ?? undefined}
              height={post.featured_image_height ?? undefined}
              className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div className="space-y-2">
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
          <h2 className="font-serif text-xl font-semibold leading-tight text-brand-text transition-colors group-hover:text-brand-primary md:text-2xl">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="line-clamp-2 text-brand-text/70">{post.excerpt}</p>
          )}
          {post.author_name && (
            <p className="text-sm text-brand-text/50">By {post.author_name} · {orgName}</p>
          )}
        </div>
      </Link>
    </article>
  );
}

export default async function BlogListingPage() {
  const org = await resolveOrg();
  if (!org) notFound();

  const posts = await getBlogPosts(org.id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <header className="mb-12">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-brand-text md:text-5xl">
          Blog
        </h1>
        <p className="mt-3 text-lg text-brand-text/70">
          Latest insights and updates from {org.name}.
        </p>
        <div className="mt-4">
          <Link
            href="/blog/feed.xml"
            className="inline-flex items-center gap-1.5 text-sm text-brand-primary hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M3.75 3a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75H4c6.075 0 11 4.925 11 11v.25c0 .414.336.75.75.75h.5a.75.75 0 0 0 .75-.75V16C17 8.82 11.18 3 4 3h-.25Z" />
              <path d="M3 8.75A.75.75 0 0 1 3.75 8H4a8 8 0 0 1 8 8v.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75V16a6 6 0 0 0-6-6h-.25A.75.75 0 0 1 3 9.25v-.5ZM7 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
            </svg>
            RSS Feed
          </Link>
        </div>
      </header>

      {posts.length === 0 ? (
        <p className="text-center text-brand-text/60">No blog posts yet. Check back soon!</p>
      ) : (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} orgName={org.name} />
          ))}
        </div>
      )}
    </main>
  );
}
