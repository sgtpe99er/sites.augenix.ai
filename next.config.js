/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Sites renders client-supplied content. Background images, image-text
    // panels, and testimonial avatars can come from anywhere a client (or our
    // AI Command Center) puts a URL — Supabase storage uploads, Unsplash /
    // stock-photo CDNs, the client's own marketing CDN, etc.
    //
    // We use the `https + **` wildcard pattern (the Next.js docs recommend
    // this exact pattern for user-generated content) so the optimizer accepts
    // any HTTPS image URL. Tradeoffs we're accepting:
    // - SSRF: Next's image optimizer fetches the URL server-side. Mitigated by
    //   Next's own per-request timeouts and the fact that the resulting bytes
    //   are returned only as image/* (not as the upstream's response body).
    // - Cache pollution: Next's optimizer caches by source URL. A client
    //   spamming unique URLs could grow the cache, but Vercel's image-quota
    //   billing makes this self-correcting.
    //
    // We deliberately keep an explicit Supabase pattern at the top of the
    // list — it's a no-op given the wildcard but documents the canonical
    // upload path.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
