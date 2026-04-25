import { useState } from "react";
import { MapPin, Phone, Globe, Stethoscope, AlertTriangle, ChevronDown, BadgeCheck } from "lucide-react";
import { TrustBadge } from "./TrustBadge";
import type { Facility } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FacilityCardProps {
  facility: Facility;
  rank?: number;
  defaultExpanded?: boolean;
}

export function FacilityCard({ facility, rank, defaultExpanded = false }: FacilityCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasFlags = facility.contradiction_flags.length > 0;

  return (
    <article className="group overflow-hidden rounded-2xl bg-surface ring-1 ring-border shadow-card transition-shadow hover:shadow-elevated">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {rank !== undefined && <span>Result #{rank}</span>}
            {facility.facility_type && (
              <>
                <span aria-hidden>·</span>
                <span>{facility.facility_type}</span>
              </>
            )}
            {facility.tavily_verified && (
              <span className="inline-flex items-center gap-1 text-[var(--trust-high)]">
                <BadgeCheck className="size-3.5" /> Web verified
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-lg font-semibold leading-tight text-foreground">{facility.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {facility.city}, {facility.state}
              {facility.distance_km !== undefined && (
                <span className="font-mono tabular-nums text-foreground/70"> · {facility.distance_km.toFixed(1)} km</span>
              )}
            </span>
            {facility.phone && (
              <a href={`tel:${facility.phone}`} className="inline-flex items-center gap-1 hover:text-primary">
                <Phone className="size-3.5" />
                <span className="font-mono">{facility.phone}</span>
              </a>
            )}
            {facility.website && (
              <a
                href={facility.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                <Globe className="size-3.5" /> Website
              </a>
            )}
          </div>
        </div>
        <TrustBadge score={facility.trust_score} size="lg" showLabel={false} />
      </div>

      {/* Verified capabilities */}
      {facility.verified_capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {facility.verified_capabilities.map((cap) => (
            <span
              key={cap}
              className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary"
            >
              <Stethoscope className="size-3" />
              {cap}
            </span>
          ))}
        </div>
      )}

      {/* Top evidence sentence (always visible) */}
      {facility.evidence_sentences[0] && (
        <div className="mx-5 mb-4 rounded-lg border-l-2 border-[var(--trust-high)] bg-muted/40 px-3 py-2">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Evidence</p>
          <p className="mt-1 text-sm text-foreground/90">
            <span className="evidence-mark">{facility.evidence_sentences[0].text}</span>
          </p>
        </div>
      )}

      {/* Contradiction flag (always visible if present) */}
      {hasFlags && (
        <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg bg-destructive/8 px-3 py-2 ring-1 ring-destructive/20">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="text-sm text-destructive">
            <p className="font-medium">{facility.contradiction_flags.length} contradiction flag{facility.contradiction_flags.length > 1 ? "s" : ""}</p>
            <p className="mt-0.5 text-destructive/85">{facility.contradiction_flags[0].description}</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between border-t border-border bg-muted/30 px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/60"
      >
        <span>Trust breakdown · agent reasoning</span>
        <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border bg-surface-muted px-5 py-4">
          <DetailRow label="Doctors on staff" value={facility.doctor_count?.toString() ?? "—"} />
          <DetailRow label="Bed capacity" value={facility.capacity?.toString() ?? "—"} />
          <DetailRow label="Trust score" value={`${facility.trust_score} / 100`} />
          {facility.tavily_news_snippet && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Recent news</p>
              <p className="mt-1 text-sm text-foreground/90">{facility.tavily_news_snippet}</p>
            </div>
          )}
          {facility.evidence_sentences.length > 1 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">All evidence</p>
              <ul className="mt-1.5 space-y-1.5">
                {facility.evidence_sentences.map((ev, i) => (
                  <li key={i} className="text-sm text-foreground/90">
                    <span className="evidence-mark">{ev.text}</span>
                    <span className="ml-2 text-xs text-muted-foreground">→ {ev.matched_capability}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {facility.contradiction_flags.length > 1 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-destructive">All flags</p>
              <ul className="mt-1.5 space-y-1.5">
                {facility.contradiction_flags.map((f, i) => (
                  <li key={i} className="text-sm text-destructive/90">{f.description}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}
