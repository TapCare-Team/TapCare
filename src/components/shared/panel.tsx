import type { ReactNode } from "react";

export function Panel({
  title,
  eyebrow,
  action,
  children
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/5 bg-panel p-6 shadow-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          {eyebrow ? <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">{eyebrow}</p> : null}
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
