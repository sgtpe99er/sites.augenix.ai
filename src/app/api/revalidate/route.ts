import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * On-demand revalidation endpoint called by the Dashboard
 * (`app.augenix.ai`) after a user approves an AI edit in the Command Center.
 *
 * Per PRD §9 ("Push Live"):
 *   POST /api/revalidate
 *   Headers: { "x-revalidate-secret": "<shared secret>" }
 *   Body:    { "orgId": "uuid", "pageSlug": "homepage" }
 *
 * The path we revalidate is just the slug — Next.js's ISR cache key already
 * includes the host, so revalidating `/${pageSlug}` invalidates the cached
 * render for whichever client domain mapped to `orgId`.
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

  const { orgId, pageSlug } = (body ?? {}) as { orgId?: string; pageSlug?: string };
  if (!orgId || !pageSlug) {
    return NextResponse.json(
      { error: 'Body must include both `orgId` and `pageSlug`.' },
      { status: 400 },
    );
  }

  const path = pageSlug === 'homepage' ? '/' : `/${pageSlug}`;
  revalidatePath(path);

  return NextResponse.json({ revalidated: true, orgId, path });
}
