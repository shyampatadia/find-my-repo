import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { trustLabel, trustLevel, type TrustLevel } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const LEVEL_STYLES: Record<TrustLevel, { bg: string; text: string; ring: string }> = {
  critical: {
    bg: "bg-[var(--trust-critical)]/10",
    text: "text-[var(--trust-critical)]",
    ring: "ring-[var(--trust-critical)]/30",
  },
  low: {
    bg: "bg-[var(--trust-low)]/10",
    text: "text-[var(--trust-low)]",
    ring: "ring-[var(--trust-low)]/30",
  },
  medium: {
    bg: "bg-[var(--trust-medium)]/15",
    text: "text-[oklch(0.45_0.12_75)]",
    ring: "ring-[var(--trust-medium)]/40",
  },
  high: {
    bg: "bg-[var(--trust-high)]/12",
    text: "text-[var(--trust-high)]",
    ring: "ring-[var(--trust-high)]/30",
  },
  verified: {
    bg: "bg-[var(--trust-verified)]/12",
    text: "text-[var(--trust-verified)]",
    ring: "ring-[var(--trust-verified)]/30",
  },
};

const SIZE_STYLES = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

const ICON_SIZE = { sm: 12, md: 14, lg: 16 };

export function TrustBadge({ score, size = "md", showLabel = true, className }: TrustBadgeProps) {
  const level = trustLevel(score);
  const styles = LEVEL_STYLES[level];
  const Icon = level === "critical" || level === "low" ? ShieldAlert : level === "medium" ? ShieldQuestion : ShieldCheck;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-mono font-medium ring-1 ring-inset tabular-nums",
        styles.bg,
        styles.text,
        styles.ring,
        SIZE_STYLES[size],
        className,
      )}
    >
      <Icon size={ICON_SIZE[size]} strokeWidth={2.25} />
      <span>{score}</span>
      {showLabel && <span className="font-sans font-normal opacity-80">· {trustLabel(score)}</span>}
    </span>
  );
}
