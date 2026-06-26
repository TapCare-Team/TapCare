import Link from "next/link";
import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  nav: { href: string; label: string; replace?: boolean }[];
  homeHref?: string;
};

export function AppShell({ title, subtitle, children, nav, homeHref = "/" }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link href={homeHref} className="text-sm uppercase tracking-[0.3em] text-muted">
              TapCare
            </Link>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <nav className="flex flex-wrap gap-3">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  replace={item.replace}
                  className="rounded-full border border-accent/20 bg-accentSoft px-4 py-2 text-accent transition hover:bg-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-full border border-black/10 px-4 py-2 text-muted transition hover:bg-white"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">{children}</main>
    </div>
  );
}
