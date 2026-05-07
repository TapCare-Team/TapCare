import type { ReactNode } from "react";

export function Panel({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/5 bg-panel p-6 shadow-panel">
      {eyebrow ? <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">{eyebrow}</p> : null}
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
