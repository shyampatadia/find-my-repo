import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Map as MapIcon,
  FileDown,
  AlertOctagon,
  TrendingDown,
  Activity,
  ShieldCheck,
  X,
  ArrowRight,
} from "lucide-react";
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
      [...STATE_DESERTS].sort(
        (a, b) => desertScoreFor(b, specialty) - desertScoreFor(a, specialty),
      ),
    [specialty],
  );

  const stats = useMemo(() => {
    const scores = STATE_DESERTS.map((d) => desertScoreFor(d, specialty));
    const verified = STATE_DESERTS.map((d) => verifiedCountFor(d, specialty)).reduce(
      (a, b) => a + b,
      0,
    );
    const critical = scores.filter((s) => s >= 75).length;
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { critical, avg, verified, regions: STATE_DESERTS.length };
  }, [specialty]);

  return (
    <div className="relative">
      {/* Hero strip */}
      <section className="border-b border-border bg-gradient-to-b from-primary/[0.04] via-background to-background">
        <div className="mx-auto max-w-7xl px-6 pb-6 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                <MapIcon className="size-3" /> Coverage intelligence
              </span>
              <h1 className="mt-3 font-serif text-4xl font-semibold leading-none tracking-tight text-foreground md:text-5xl">
                Desert Map
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {STATE_DESERTS.length} regions. {STATE_DESERTS.reduce((a, d) => a + d.total_facilities, 0).toLocaleString()} facilities. One question:{" "}
                <span className="text-foreground">where is verified care actually missing?</span>
              </p>
            </div>
            <button
              disabled
              className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background opacity-90 transition-all hover:opacity-100 disabled:cursor-not-allowed"
              title="Streams from /api/report/district via Tavily Research"
            >
              <FileDown className="size-4" />
              Export NGO report
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Stats strip */}
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-border md:grid-cols-4">
            <Stat
              icon={AlertOctagon}
              label="Critical deserts"
              value={stats.critical.toString()}
              hint="states scoring 75+"
              tone="danger"
            />
            <Stat
              icon={TrendingDown}
              label="Avg desert score"
              value={stats.avg.toString()}
              hint="across all regions"
              tone="warn"
            />
            <Stat
              icon={ShieldCheck}
              label="Verified facilities"
              value={stats.verified.toLocaleString()}
              hint={
                specialty === "overall"
                  ? "all specialties"
                  : `for ${SPECIALTIES.find((s) => s.id === specialty)?.label.toLowerCase()}`
              }
              tone="ok"
            />
            <Stat
              icon={Activity}
              label="Live regions"
              value={stats.regions.toString()}
              hint="streaming from desert_map"
              tone="info"
            />
          </dl>
        </div>
      </section>

      {/* Specialty toggle */}
      <section className="sticky top-[57px] z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-6 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground shrink-0">
            Filter by
          </span>
          <div className="flex gap-1.5">
            {SPECIALTIES.map((sp) => (
              <button
                key={sp.id}
                onClick={() => setSpecialty(sp.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  specialty === sp.id
                    ? "bg-foreground text-background shadow-card"
                    : "bg-muted text-foreground/70 hover:bg-primary-soft hover:text-primary",
                )}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Map + side panel */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Map */}
          <div className="relative overflow-hidden rounded-2xl bg-surface ring-1 ring-border shadow-elevated">
            <div className="h-[640px] w-full">
              <DesertMap specialty={specialty} selectedState={selected} onStateClick={setSelected} />
            </div>

            {/* Floating legend (top-left, glass) */}
            <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[280px] rounded-xl bg-surface/85 p-3 ring-1 ring-border shadow-card backdrop-blur-md">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                Desert score · {SPECIALTIES.find((s) => s.id === specialty)?.label}
              </p>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full">
                {[
                  { c: "#0d9488", l: "0" },
                  { c: "#16a34a", l: "20" },
                  { c: "#ca8a04", l: "35" },
                  { c: "#ea580c", l: "55" },
                  { c: "#dc2626", l: "75" },
                ].map((s) => (
                  <span key={s.l} className="flex-1" style={{ background: s.c }} />
                ))}
              </div>
              <div className="mt-1.5 flex justify-between font-mono text-[9px] tabular-nums text-muted-foreground">
                <span>covered</span>
                <span>moderate</span>
                <span>critical</span>
              </div>
            </div>

            {/* Floating attribution chip (bottom-left) */}
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-surface/85 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground ring-1 ring-border backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-[#16a34a]" />
              <span>desert_map · live</span>
            </div>
          </div>

          {/* Side panel */}
          <aside className="space-y-4">
            {selected ? (
              <SelectedPanel
                state={selected}
                specialty={specialty}
                onClose={() => setSelected(null)}
              />
            ) : (
              <EmptySelectionHint />
            )}

            {/* Worst N deserts */}
            <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border shadow-card">
              <header className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Worst regions
                  </p>
                  <h4 className="mt-0.5 text-sm font-semibold text-foreground">
                    {SPECIALTIES.find((s) => s.id === specialty)?.label} ranking
                  </h4>
                </div>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {ranked.length}
                </span>
              </header>
              <ol className="max-h-[460px] overflow-y-auto">
                {ranked.slice(0, 12).map((d, i) => {
                  const score = desertScoreFor(d, specialty);
                  const verified = verifiedCountFor(d, specialty);
                  const isSelected = selected?.iso === d.iso;
                  return (
                    <li key={d.iso}>
                      <button
                        onClick={() => setSelected(d)}
                        className={cn(
                          "group flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left transition-all last:border-b-0",
                          isSelected ? "bg-primary-soft" : "hover:bg-muted/50",
                        )}
                      >
                        <span
                          className={cn(
                            "grid w-6 shrink-0 place-items-center rounded font-mono text-[10px] tabular-nums",
                            i < 3
                              ? "bg-destructive/15 text-destructive"
                              : "text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{d.state}</p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {verified} verified · {d.flagged_facilities} flag
                            {d.flagged_facilities !== 1 && "s"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ScorePill score={score} />
                          <ArrowRight
                            className={cn(
                              "size-3.5 text-muted-foreground transition-all",
                              isSelected
                                ? "translate-x-0 text-primary"
                                : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                            )}
                          />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>
        </div>
      </section>

      {/* Mapbox style overrides */}
      <style>{`
        .mapboxgl-ctrl-attrib { background: rgba(255,255,255,0.6) !important; backdrop-filter: blur(6px); border-radius: 6px; }
        .mapboxgl-ctrl-group { border-radius: 10px !important; box-shadow: 0 4px 16px oklch(0.18 0.02 230 / 0.08) !important; border: 1px solid oklch(0.91 0.008 220) !important; overflow: hidden; }
        .mapboxgl-ctrl-group button { width: 32px !important; height: 32px !important; }
        .mapboxgl-popup-content { padding: 14px 16px !important; border-radius: 14px !important; box-shadow: 0 12px 36px rgba(15, 23, 42, 0.16) !important; border: 1px solid oklch(0.91 0.008 220); }
        .mapboxgl-popup-tip { display: none !important; }
        .aarogya-popup .mapboxgl-popup-content { animation: popupIn .2s ease-out; }
        @keyframes popupIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint: string;
  tone: "danger" | "warn" | "ok" | "info";
}) {
  const toneClass = {
    danger: "text-[#dc2626] bg-[#dc2626]/10",
    warn: "text-[#ea580c] bg-[#ea580c]/10",
    ok: "text-[#0d9488] bg-[#0d9488]/10",
    info: "text-primary bg-primary-soft",
  }[tone];
  return (
    <div className="bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className={cn("inline-grid size-8 place-items-center rounded-lg", toneClass)}>
          <Icon className="size-4" strokeWidth={2.25} />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          {hint}
        </span>
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 75
      ? "#dc2626"
      : score >= 55
        ? "#ea580c"
        : score >= 35
          ? "#ca8a04"
          : "#16a34a";
  return (
    <span
      className="rounded-md px-1.5 py-0.5 font-mono text-xs tabular-nums"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {score}
    </span>
  );
}

function EmptySelectionHint() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-muted/40 p-5 text-center">
      <div className="mx-auto inline-grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
        <MapIcon className="size-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">Click any state</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Inspect verified facility counts, contradiction flags, and the nearest viable alternative.
      </p>
    </div>
  );
}

function SelectedPanel({
  state,
  specialty,
  onClose,
}: {
  state: StateDesert;
  specialty: Specialty;
  onClose: () => void;
}) {
  const score = desertScoreFor(state, specialty);
  const verified = verifiedCountFor(state, specialty);
  const color =
    score >= 75
      ? "#dc2626"
      : score >= 55
        ? "#ea580c"
        : score >= 35
          ? "#ca8a04"
          : "#16a34a";
  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border shadow-elevated">
      <div className="relative px-5 pb-4 pt-5" style={{ background: `linear-gradient(135deg, ${color}1A, transparent)` }}>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Clear selection"
        >
          <X className="size-3.5" />
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Selected · {state.coverage_status.replace("_", " ")}
        </p>
        <h3 className="mt-1 text-xl font-semibold leading-tight text-foreground">{state.state}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-4xl font-semibold tabular-nums" style={{ color }}>
            {score}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            desert score
          </span>
        </div>
      </div>
      <dl className="divide-y divide-border text-sm">
        <Row label="Verified facilities" value={verified.toString()} />
        <Row label="Total facilities" value={state.total_facilities.toString()} />
        <Row label="Average trust score" value={state.avg_trust_score.toString()} />
        <Row
          label="Contradiction flags"
          value={state.flagged_facilities.toString()}
          accent={state.flagged_facilities > 20 ? "#dc2626" : undefined}
        />
        {state.nearest_alternative_km && (
          <Row
            label="Nearest alternative"
            value={`${state.nearest_alternative_km} km`}
            accent="#dc2626"
          />
        )}
      </dl>
      <button className="flex w-full items-center justify-between gap-2 border-t border-border bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
        <span>Open district report</span>
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5">
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
