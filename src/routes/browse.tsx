import { createFileRoute } from "@tanstack/react-router";
import { Table, Construction } from "lucide-react";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Facility Browser — Aarogya Intelligence" },
      {
        name: "description",
        content:
          "Searchable, filterable browser of all 10,000 verified Indian medical facilities. Sort by trust score, filter by state and specialty.",
      },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary">
          <Table className="size-3" /> Full registry
        </span>
        <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-foreground">Facility Browser</h1>
        <p className="mt-2 text-muted-foreground">
          All 10,000 facilities, ranked by trust score and filterable by state, specialty, and contradiction flags.
        </p>
      </header>
      <div className="mt-8 grid h-[600px] place-items-center rounded-2xl bg-surface ring-1 ring-border shadow-card">
        <div className="text-center">
          <Construction className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Searchable table · coming next
          </p>
        </div>
      </div>
    </main>
  );
}
