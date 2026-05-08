export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-24 text-brand-text">
      <p className="text-xs uppercase tracking-[0.2em] text-black/50">404</p>
      <h1 className="font-serif text-4xl leading-tight md:text-5xl">Page not found</h1>
      <p className="text-base leading-relaxed text-black/70">
        We couldn&apos;t find that page on this site.
      </p>
    </main>
  );
}
