import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Map as MapIcon, FileDown, ArrowRight } from "lucide-react";
import { DesertMap } from "@/components/aarogya/DesertMap";
import {
  SPECIALTIES,
  STATE_DESERTS,
  desertScoreFor,
  verifiedCountFor,
  type Specialty,
  type StateDesert,
} from "@/lib/desert-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Desert Map — Aarogya Intelligence" },
      {
        name: "description",
        content:
          "Interactive India map of healthcare deserts by specialty. NGO planners and government auditors use it to see where verified care is missing.",
      },
      { property: "og:title", content: "Desert Map — Aarogya Intelligence" },
      {
        property: "og:description",
        content: "See healthcare coverage gaps across every Indian state, recolored live by specialty.",
      },
    ],
  }),
  component: DesertMapPage,
});

function DesertMapPage() {
  const [specialty, setSpecialty] = useState<Specialty>("overall");
  const [selected, setSelected] = useState<StateDesert | null>(null);

  const ranked = useMemo(
    () =>
      [...STATE_DESERTS]
        .sort((a, b) => desertScoreFor(b, specialty) - desertScoreFor(a, specialty))
        .slice(0, 10),
    [specialty],
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary">
            <MapIcon className="size-3" /> Coverage intelligence
          </span>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-foreground">
            Desert Map
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Toggle by specialty to recolor states instantly. Click any state for verified facility counts and the
            nearest viable alternative.
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground opacity-60"
          title="Wired to Tavily Research /api/report/district endpoint"
        >
          <FileDown className="size-4" />
          Export NGO report
        </button>
      </header>

      {/* Specialty toggle */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {SPECIALTIES.map((sp) => (
          <button
            key={sp.id}
            onClick={() => setSpecialty(sp.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              specialty === sp.id
                ? "bg-primary text-primary-foreground shadow-card"
                : "bg-muted text-foreground/70 hover:bg-primary-soft hover:text-primary",
            )}
          >
            {sp.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Map */}
        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border shadow-card">
          <div className="h-[640px] w-full">
            <DesertMap specialty={specialty} onStateClick={setSelected} />
          </div>
          <Legend />
        </div>

        {/* Side panel */}
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border shadow-card">
            <header className="border-b border-border bg-surface-muted px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Worst 10 deserts
              </p>
              <h4 className="mt-0.5 text-sm font-semibold text-foreground">
                {SPECIALTIES.find((s) => s.id === specialty)?.label} coverage
              </h4>
            </header>
            <ol>
              {ranked.map((d, i) => {
                const score = desertScoreFor(d, specialty);
                const verified = verifiedCountFor(d, specialty);
                return (
                  <li key={d.iso}>
                    <button
                      onClick={() => setSelected(d)}
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left transition-colors hover:bg-muted/40 last:border-b-0",
                        selected?.iso === d.iso && "bg-primary-soft",
                      )}
                    >
                      <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{d.state}</p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {verified} verified
                        </p>
                      </div>
                      <span
                        className="rounded-md px-1.5 py-0.5 font-mono text-xs tabular-nums"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${scoreColor(score)} 18%, transparent)`,
                          color: scoreColor(score),
                        }}
                      >
                        {score}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {selected && <SelectedPanel state={selected} specialty={specialty} />}
        </aside>
      </div>
    </main>
  );
}

function Legend() {
  return (
    <div className="flex items-center justify-between border-t border-border bg-surface-muted px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Desert score
        </span>
        <div className="flex h-2 w-44 overflow-hidden rounded-full">
          <span className="flex-1" style={{ background: "oklch(0.5 0.13 175)" }} />
          <span className="flex-1" style={{ background: "oklch(0.62 0.14 155)" }} />
          <span className="flex-1" style={{ background: "oklch(0.78 0.15 85)" }} />
          <span className="flex-1" style={{ background: "oklch(0.68 0.17 50)" }} />
          <span className="flex-1" style={{ background: "oklch(0.56 0.21 27)" }} />
        </div>
        <div className="flex w-44 justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
          <span>covered</span>
          <span>critical</span>
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {STATE_DESERTS.length} regions
      </p>
    </div>
  );
}

function SelectedPanel({ state, specialty }: { state: StateDesert; specialty: Specialty }) {
  const score = desertScoreFor(state, specialty);
  const verified = verifiedCountFor(state, specialty);
  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border shadow-card">
      <header className="border-b border-border bg-surface-muted px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Selected
        </p>
        <h4 className="mt-0.5 text-base font-semibold text-foreground">{state.state}</h4>
      </header>
      <dl className="divide-y divide-border text-sm">
        <Row label="Desert score" value={score.toString()} accent={scoreColor(score)} />
        <Row label="Verified facilities" value={verified.toString()} />
        <Row label="Total facilities" value={state.total_facilities.toString()} />
        <Row label="Avg trust score" value={state.avg_trust_score.toString()} />
        <Row label="Contradiction flags" value={state.flagged_facilities.toString()} />
        {state.nearest_alternative_km && (
          <Row
            label="Nearest alternative"
            value={`${state.nearest_alternative_km} km`}
            accent="oklch(0.56 0.21 27)"
          />
        )}
      </dl>
      <button className="flex w-full items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-muted/60">
        <span>View district report</span>
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className="font-mono text-sm tabular-nums"
        style={accent ? { color: accent, fontWeight: 600 } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 75) return "oklch(0.56 0.21 27)";
  if (score >= 55) return "oklch(0.68 0.17 50)";
  if (score >= 35) return "oklch(0.55 0.13 75)";
  if (score >= 20) return "oklch(0.5 0.13 155)";
  return "oklch(0.45 0.13 175)";
}
