import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

const NAV = [
  { to: "/", label: "Crisis Query" },
  { to: "/map", label: "Desert Map" },
  { to: "/browse", label: "Facility Browser" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3.5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-4" strokeWidth={2.5} />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-base font-semibold text-foreground">Aarogya</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Intelligence
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="size-1.5 rounded-full bg-[var(--trust-high)]" />
          <span>10,000 facilities · live</span>
        </div>
      </div>
    </header>
  );
}
