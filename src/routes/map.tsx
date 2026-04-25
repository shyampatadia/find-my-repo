import { createFileRoute } from "@tanstack/react-router";
import { Map as MapIcon, Construction } from "lucide-react";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Desert Map — Aarogya Intelligence" },
      {
        name: "description",
        content:
          "Interactive map of India showing healthcare deserts by specialty. For NGO planners, government auditors, and policymakers.",
      },
    ],
  }),
  component: DesertMapPage,
});

function DesertMapPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary">
          <MapIcon className="size-3" /> Coverage intelligence
        </span>
        <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-foreground">Desert Map</h1>
        <p className="mt-2 text-muted-foreground">
          Toggle by specialty to recolor districts instantly. Click a district to see verified facility counts and the
          nearest viable alternative.
        </p>
      </header>
      <div className="mt-8 grid h-[600px] place-items-center rounded-2xl bg-surface ring-1 ring-border shadow-card">
        <div className="text-center">
          <Construction className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Mapbox GL integration · coming next
          </p>
        </div>
      </div>
    </main>
  );
}
