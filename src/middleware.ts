import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Sites middleware — maps the incoming `Host` header to a normalized internal
 * domain string and forwards it to downstream pages via the `x-augenix-host`
 * header.
 *
 * The Sites project resolves the host → `organizations.custom_domain` lookup
 * inside the catch-all page (`src/app/[...slug]/page.tsx`) so that ISR caching
 * keys are scoped per host. Per PRD §9, no auth happens here — Sites visitors
 * are anonymous.
 *
 * Notes:
 * - We strip a leading `www.` so that apex and `www` map to the same org.
 * - We strip the port so localhost / preview environments resolve cleanly.
 * - The canonical Sites URL (`sites.augenix.ai`) is never expected to match an
 *   org row; it falls through to the static landing at `src/app/page.tsx`.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const normalized = host.toLowerCase().replace(/^www\./, '').split(':')[0];

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-augenix-host', normalized);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Run on every request except Next.js internals and common static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
