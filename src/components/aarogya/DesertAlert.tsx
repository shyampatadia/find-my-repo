import { AlertOctagon, ArrowRight } from "lucide-react";
import type { DesertAlert as DesertAlertType } from "@/lib/api";

interface DesertAlertProps {
  alerts: DesertAlertType[];
}

export function DesertAlert({ alerts }: DesertAlertProps) {
  if (alerts.length === 0) return null;

  return (
    <aside className="overflow-hidden rounded-2xl bg-[var(--trust-critical)]/8 ring-1 ring-[var(--trust-critical)]/25">
      <div className="flex items-start gap-3 px-5 py-4">
        <AlertOctagon className="mt-0.5 size-5 shrink-0 text-[var(--trust-critical)]" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[var(--trust-critical)]">
            Healthcare desert detected
          </h4>
          <p className="mt-0.5 text-sm text-foreground/80">
            {alerts.length} surrounding district{alerts.length > 1 ? "s have" : " has"} no
            verified facilities for this specialty.
          </p>
        </div>
      </div>
      <ul className="divide-y divide-[var(--trust-critical)]/15 border-t border-[var(--trust-critical)]/15">
        {alerts.map((a) => (
          <li key={a.district} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <div>
              <p className="font-medium text-foreground">
                {a.district}, {a.state}
              </p>
              <p className="text-xs text-muted-foreground">{a.missing_specialty}</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
              <div className="text-right">
                <p className="text-[var(--trust-critical)]">desert {a.desert_score}</p>
                <p className="text-muted-foreground">→ {a.nearest_alternative_km} km</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
