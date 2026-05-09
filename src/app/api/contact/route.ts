import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/lib/supabase/server-client';

const SITES_HOST = (process.env.NEXT_PUBLIC_SITES_HOST ?? 'sites.augenix.ai').toLowerCase();

/**
 * Reasonable upper bound on form-field length to avoid `text` columns
 * filling with thousands of characters of pasted markdown / spam blobs.
 * Inputs longer than this are truncated server-side rather than rejected
 * so a long-but-legitimate `message` doesn't surface as a confusing
 * validation error.
 */
const MAX_FIELD_LENGTH = 4000;

/**
 * Minimal email shape check. Deliberately permissive — full RFC 5322
 * validation isn't worth the maintenance cost in a form-submission code
 * path. We only reject obvious garbage so the contacts table doesn't
 * accumulate visibly-broken email rows.
 */
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function readField(formData: FormData, key: string): string {
  const raw = formData.get(key);
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, MAX_FIELD_LENGTH);
}

/**
 * Build the post-submit redirect URL. We prefer to redirect the visitor
 * back to the page they submitted from (so they stay inside the
 * customer's branded layout) but only if the Referer is on the same host
 * as the form post — never trust an attacker-controlled Referer to do an
 * open redirect.
 */
function resolveRedirectTarget(
  refererHeader: string | null,
  host: string,
  sectionId: string,
): URL {
  const fallback = new URL(`https://${host}/`);
  fallback.searchParams.set('contact', 'submitted');
  fallback.searchParams.set('s', sectionId);

  if (!refererHeader) return fallback;

  let referer: URL;
  try {
    referer = new URL(refererHeader);
  } catch {
    return fallback;
  }

  if (referer.host.toLowerCase() !== host) {
    // Cross-origin Referer — could be a phishing attempt sending POSTs
    // from somewhere else with a forged Origin. Drop the path and just
    // bounce them to the apex of the actual host they're on.
    return fallback;
  }

  referer.searchParams.set('contact', 'submitted');
  referer.searchParams.set('s', sectionId);
  return referer;
}

/**
 * `POST /api/contact` — receives a `multipart/form-data` (or
 * `application/x-www-form-urlencoded`) submission from a
 * `ContactFormSection` rendered on a client custom domain, validates the
 * minimum field set, and writes it through the `submit_contact_form`
 * SECURITY DEFINER RPC.
 *
 * Why an RPC: the Sites renderer authenticates as `anon` and cannot
 * satisfy the `members_insert_*` RLS policy on `public.contacts`. The
 * RPC normalizes the host, looks up the org by `custom_domain`, and
 * inserts with that resolved `org_id`. See
 * `supabase/migrations/.../submit_contact_form_rpc.sql` in
 * `app.augenix.ai`.
 *
 * Success: 303 See Other back to the submitting page (or the apex of
 * the host as a fallback) with `?contact=submitted&s=<sectionId>` so
 * `ContactFormSection` can render its post-submit thank-you panel.
 *
 * Error: plain-text 4xx/5xx for validation / server failures. We
 * intentionally do NOT enrich the error response with org branding —
 * the form's `noscript` browser POST flow benefits from a stable error
 * surface.
 */
export async function POST(request: Request) {
  const headerBag = await headers();
  const host = headerBag.get('x-augenix-host')?.toLowerCase() ?? '';

  // The middleware sets `x-augenix-host` from the request's `Host` header.
  // Submissions from the canonical Sites URL itself (no client domain
  // claimed) have no org to attribute to and are rejected.
  if (!host || host === SITES_HOST) {
    return new NextResponse('This form can only be submitted from a claimed custom domain.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new NextResponse('Bad request.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const name = readField(formData, 'name');
  const email = readField(formData, 'email');
  const phone = readField(formData, 'phone');
  const company = readField(formData, 'company');
  const message = readField(formData, 'message');
  const sectionId = readField(formData, '_section_id') || 'contact_form';

  // Bare-minimum validation: name + valid-looking email. Phone, company,
  // and message are all optional from the schema's perspective; the
  // section component itself decides whether to render those fields.
  if (!name || !email || !EMAIL_PATTERN.test(email)) {
    return new NextResponse('Please provide your name and a valid email address.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const supabase = getSupabaseServerClient();
  const { data: contactId, error } = await supabase.rpc('submit_contact_form', {
    p_host: host,
    p_name: name,
    p_email: email,
    p_phone: phone || null,
    p_company: company || null,
    p_message: message || null,
  });

  if (error) {
    console.error('[/api/contact] supabase rpc error', error);
    return new NextResponse('Something went wrong. Please try again later.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (!contactId) {
    // RPC returned NULL — no organization claims this host. Should not
    // happen in normal traffic since the page wouldn't have rendered in
    // the first place, but it's possible if the org's `custom_domain` is
    // unset between the page load and the form submit.
    return new NextResponse('This site is not currently accepting submissions.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const target = resolveRedirectTarget(headerBag.get('referer'), host, sectionId);

  // 303 See Other: ensures the browser does a GET on the redirect target
  // (so refreshing the page won't re-submit the form) and works
  // universally across browsers for the POST → success-page flow.
  return NextResponse.redirect(target, 303);
}
