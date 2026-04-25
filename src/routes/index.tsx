import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SearchBar } from "@/components/aarogya/SearchBar";
import { FacilityCard } from "@/components/aarogya/FacilityCard";
import { TrustBadge } from "@/components/aarogya/TrustBadge";
import { DesertAlert } from "@/components/aarogya/DesertAlert";
import { AgentTrace } from "@/components/aarogya/AgentTrace";
import { crisisQuery, type CrisisQueryResponse } from "@/lib/api";
import { Sparkles, Languages, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crisis Query — Aarogya Intelligence" },
      {
        name: "description",
        content:
          "Find verified emergency healthcare across India in seconds. Voice and multilingual support for ASHA workers, ambulance drivers, and patients.",
      },
    ],
  }),
  component: CrisisQueryPage,
});

const QUICK_FILTERS = ["ICU", "Blood bank", "Dialysis", "Trauma", "Neonatal", "Cardiac", "Obstetric"];

function CrisisQueryPage() {
  const [response, setResponse] = useState<CrisisQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

  const handleQuery = async (q: string) => {
    setCurrentQuery(q);
    setLoading(true);
    try {
      const res = await crisisQuery(q);
      setResponse(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 font-mono text-xs uppercase tracking-widest text-primary">
          <Sparkles className="size-3" />
          Verified · multilingual · sub-5s
        </span>
        <h1 className="mt-5 font-serif text-5xl font-semibold leading-tight tracking-tight text-foreground">
          A postal code shouldn't determine a lifespan.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Aarogya turns 10,000 unverified facility records into a living, queryable healthcare network — with
          contradiction flags, evidence sentences, and desert maps.
        </p>
      </section>

      {/* Search */}
      <section className="mx-auto mt-8 max-w-3xl">
        <SearchBar onSubmit={handleQuery} loading={loading} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Languages className="size-3.5 text-muted-foreground" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Try</span>
          {QUICK_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => handleQuery(`${f} care near Ranchi`)}
              disabled={loading}
              className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/80 transition-colors hover:bg-primary-soft hover:text-primary disabled:opacity-50"
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Results */}
      {response && (
        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {response.facilities.length} verified result{response.facilities.length !== 1 && "s"} ·{" "}
                  {response.query.parsed_specialty} · {response.query.parsed_location}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Query: <span className="italic text-muted-foreground">"{currentQuery}"</span>
                </p>
              </div>
            </header>
            {response.desert_alerts.length > 0 && <DesertAlert alerts={response.desert_alerts} />}
            <div className="space-y-3">
              {response.facilities.map((f, i) => (
                <FacilityCard key={f.id} facility={f} rank={i + 1} defaultExpanded={i === 0} />
              ))}
            </div>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <AgentTrace
              trace={response.trace}
              totalMs={response.total_ms}
              traceId={response.trace_id}
            />
            <TrustScaleLegend />
          </aside>
        </section>
      )}

      {!response && !loading && <Showcase />}
    </main>
  );
}

function TrustScaleLegend() {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-border shadow-card">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Trust scale</p>
      <div className="mt-3 h-2 w-full rounded-full gradient-trust" />
      <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
        <span>0</span>
        <span>40</span>
        <span>55</span>
        <span>70</span>
        <span>85</span>
        <span>100</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <TrustBadge score={32} size="sm" />
        <TrustBadge score={62} size="sm" />
        <TrustBadge score={76} size="sm" />
        <TrustBadge score={92} size="sm" />
      </div>
    </div>
  );
}

function Showcase() {
  return (
    <section className="mt-16 grid gap-6 md:grid-cols-3">
      {[
        {
          icon: MapPin,
          title: "Desert Map",
          body: "Visualize coverage gaps by specialty across every Indian district. NGOs use it to plan where to build next.",
        },
        {
          icon: Languages,
          title: "Voice in any language",
          body: "Hindi, Tamil, Bengali, Telugu, Marathi, Gujarati — Whisper transcribes, the agent reasons, TTS replies.",
        },
        {
          icon: Sparkles,
          title: "Trust with evidence",
          body: "Every verified capability comes with a sentence from the source text. Every contradiction is flagged.",
        },
      ].map((item) => (
        <div key={item.title} className="rounded-2xl bg-surface p-6 ring-1 ring-border shadow-card">
          <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
            <item.icon className="size-5" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
        </div>
      ))}
    </section>
  );
}
