import { lazy, Suspense, useEffect, useState } from "react";
import type { Specialty, StateDesert } from "@/lib/desert-data";

// Mapbox GL touches `window` at import time — load it only on the client.
const DesertMapClient = lazy(() => import("./DesertMapInner"));

interface DesertMapProps {
  specialty: Specialty;
  selectedState?: StateDesert | null;
  onStateClick?: (state: StateDesert) => void;
}

function Skeleton() {
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-surface to-surface-muted">
      <div className="text-center">
        <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-[mapload_1.4s_ease-in-out_infinite] bg-primary" />
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Initializing tiles…
        </p>
      </div>
      <style>{`@keyframes mapload { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
    </div>
  );
}

export function DesertMap(props: DesertMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Skeleton />;
  return (
    <Suspense fallback={<Skeleton />}>
      <DesertMapClient {...props} />
    </Suspense>
  );
}
