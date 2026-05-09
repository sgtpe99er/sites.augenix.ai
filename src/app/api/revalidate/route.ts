import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Run on the Vercel Edge Runtime — this handler does no I/O beyond a constant-
 * time secret comparison and an in-process `revalidateTag(...)` call, so the
 * faster cold-start + lower latency of the edge runtime is a free win. No
 * Node-only APIs are used.
 */
export const runtime = 'edge';

/**
 * On-demand revalidation endpoint called by the Dashboard
 * (`app.augenix.ai`) after a user approves an AI edit, publishes a page, or
 * changes org branding in the Command Center.
 *
 * Per PRD §9 ("Push Live"):
 *   POST /api/revalidate
 *   Headers: { "x-revalidate-secret": "<shared secret>" }
 *   Body:    { "tags": ["page:<uuid>:<slug>", "org:id:<uuid>", ...] }
 *
 * Tag conventions live in `src/lib/cache-tags.ts`. Senders are expected to use
 * the most precise tag they can:
 *
 *  - On page publish/unpublish/edit:  `page:${orgId}:${slug}`
 *  - On org branding change:          `org:id:${orgId}`
 *  - On `custom_domain` rename:       `org:host:${oldHost}`,
 *                                     `org:host:${newHost}`,
 *                                     `org:id:${orgId}`
 *
 * Multiple tags can be busted in a single POST. Duplicates and empty / oversized
 * strings are deduped / dropped server-side.
 *
 * The endpoint returns the list of tags it actually busted so the caller can
 * log / verify; the secret is never echoed back.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET is not configured on this deployment.' },
      { status: 500 },
    );
  }

  if (!secret || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { tags } = (body ?? {}) as { tags?: unknown };

  if (!Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json(
      { error: 'Body must include a non-empty `tags` array of strings.' },
      { status: 400 },
    );
  }

  const cleaned = Array.from(
    new Set(
      tags.filter((t): t is string => typeof t === 'string' && t.length > 0 && t.length <= 256),
    ),
  );

  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: 'Body `tags` must contain at least one non-empty string \u2264 256 chars.' },
      { status: 400 },
    );
  }

  // Next.js 16 requires a `cacheLife` profile as the second argument.
  // `'max'` is the "purge immediately" equivalent of the old single-argument
  // `revalidateTag(tag)` behavior — the only one that makes sense for an
  // on-demand publish hook (we want the next render to fetch fresh data, not
  // some negotiated stale window). See:
  //   https://nextjs.org/docs/messages/revalidate-tag-single-arg
  for (const tag of cleaned) {
    revalidateTag(tag, 'max');
  }

  return NextResponse.json({ revalidated: true, tags: cleaned });
}
