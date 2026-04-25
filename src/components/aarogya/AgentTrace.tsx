import { Activity, CheckCircle2, AlertTriangle, RotateCw } from "lucide-react";
import type { AgentTraceStep } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AgentTraceProps {
  trace: AgentTraceStep[];
  totalMs: number;
  traceId: string;
}

export function AgentTrace({ trace, totalMs, traceId }: AgentTraceProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border shadow-card">
      <header className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Agent trace</h4>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs tabular-nums text-muted-foreground">
          <span>{totalMs} ms</span>
          <span className="rounded bg-muted px-1.5 py-0.5">{traceId}</span>
        </div>
      </header>
      <ol className="divide-y divide-border">
        {trace.map((step, i) => {
          const Icon =
            step.status === "ok" ? CheckCircle2 : step.status === "retry" ? RotateCw : AlertTriangle;
          const iconColor =
            step.status === "ok"
              ? "text-[var(--trust-high)]"
              : step.status === "retry"
                ? "text-[var(--trust-medium)]"
                : "text-destructive";
          return (
            <li key={i} className="flex items-start gap-3 px-4 py-2.5">
              <Icon className={cn("mt-0.5 size-4 shrink-0", iconColor)} strokeWidth={2.25} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-xs font-semibold text-foreground">{step.node}</p>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {step.duration_ms}ms
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{step.summary}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
