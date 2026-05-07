export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="rounded-3xl border border-black/5 bg-white p-10 text-center shadow-panel">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">TapCare</p>
        <h1 className="mt-3 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted">
          The requested household or dashboard page is not available in this view.
        </p>
      </div>
    </div>
  );
}
