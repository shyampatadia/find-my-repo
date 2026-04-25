import { useEffect, useRef, useState } from "react";
import mapboxgl, { type ExpressionSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  STATE_DESERTS,
  desertScoreFor,
  verifiedCountFor,
  type Specialty,
  type StateDesert,
} from "@/lib/desert-data";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const INDIA_STATES_GEOJSON =
  "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States";

interface DesertMapProps {
  specialty: Specialty;
  selectedState?: StateDesert | null;
  onStateClick?: (state: StateDesert) => void;
}

const NAME_ALIASES: Record<string, string> = {
  "Andaman & Nicobar Island": "Andaman and Nicobar",
  "Andaman and Nicobar Islands": "Andaman and Nicobar",
  "Andaman and Nicobar": "Andaman and Nicobar",
  "Arunanchal Pradesh": "Arunachal Pradesh",
  "Dadara & Nagar Havelli": "Dadra and Nagar Haveli and Daman and Diu",
  "Dadra and Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu & Kashmir": "Jammu and Kashmir",
  "NCT of Delhi": "Delhi",
  Delhi: "Delhi",
  Telangana: "Telangana",
};

function normalize(name: string | undefined | null): string {
  if (!name) return "";
  return NAME_ALIASES[name] ?? name;
}

function scoreToColor(score: number): string {
  if (score >= 75) return "#dc2626"; // red-600
  if (score >= 55) return "#ea580c"; // orange-600
  if (score >= 35) return "#ca8a04"; // yellow-600
  if (score >= 20) return "#16a34a"; // green-600
  return "#0d9488"; // teal-600
}

function colorExpression(specialty: Specialty): ExpressionSpecification {
  const pairs: (string | string[])[] = [];
  for (const d of STATE_DESERTS) {
    const score = desertScoreFor(d, specialty);
    pairs.push(d.state, scoreToColor(score));
  }
  return [
    "match",
    ["get", "normalized_name"],
    ...pairs,
    "#e5e7eb",
  ] as unknown as ExpressionSpecification;
}

export function DesertMap({ specialty, selectedState, onStateClick }: DesertMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const layersAddedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<"booting" | "loading" | "ready">("booting");

  // Init once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) {
      setError("Mapbox token missing. Add VITE_MAPBOX_TOKEN to .env.");
      return;
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [82.5, 22.5],
      zoom: 3.5,
      maxZoom: 7,
      minZoom: 2.5,
      attributionControl: false,
      projection: { name: "mercator" },
      cooperativeGestures: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }), "top-right");

    const addLayers = async () => {
      if (layersAddedRef.current) return;
      setProgress("loading");

      try {
        const res = await fetch(INDIA_STATES_GEOJSON);
        if (!res.ok) throw new Error(`Boundary fetch failed: ${res.status}`);
        const raw = (await res.json()) as GeoJSON.FeatureCollection;

        const features = raw.features.map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            normalized_name: normalize(
              (f.properties as Record<string, unknown> | null)?.NAME_1 as string | undefined ??
                (f.properties as Record<string, unknown> | null)?.ST_NM as string | undefined ??
                (f.properties as Record<string, unknown> | null)?.st_nm as string | undefined,
            ),
          },
        }));

        if (!map.getSource("states")) {
          map.addSource("states", {
            type: "geojson",
            data: { ...raw, features } as GeoJSON.FeatureCollection,
            generateId: true,
          });
        }

        // Soft glow underneath
        if (!map.getLayer("states-glow")) {
          map.addLayer({
            id: "states-glow",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": colorExpression(specialty),
              "fill-opacity": 0.18,
            },
          });
        }

        if (!map.getLayer("states-fill")) {
          map.addLayer({
            id: "states-fill",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": colorExpression(specialty),
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                0.95,
                ["boolean", ["feature-state", "hover"], false],
                0.88,
                0.7,
              ],
              "fill-outline-color": "#ffffff",
            },
          });
        }

        if (!map.getLayer("states-outline")) {
          map.addLayer({
            id: "states-outline",
            type: "line",
            source: "states",
            paint: {
              "line-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                "#0f172a",
                "#ffffff",
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                2.4,
                ["boolean", ["feature-state", "hover"], false],
                1.4,
                0.6,
              ],
            },
          });
        }

        // Hover
        let hoveredId: number | string | null = null;
        map.on("mousemove", "states-fill", (e) => {
          if (!e.features?.length) return;
          if (hoveredId !== null) {
            map.setFeatureState({ source: "states", id: hoveredId }, { hover: false });
          }
          hoveredId = e.features[0].id ?? null;
          if (hoveredId !== null) {
            map.setFeatureState({ source: "states", id: hoveredId }, { hover: true });
          }
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "states-fill", () => {
          if (hoveredId !== null) {
            map.setFeatureState({ source: "states", id: hoveredId }, { hover: false });
          }
          hoveredId = null;
          map.getCanvas().style.cursor = "";
        });

        // Click
        map.on("click", "states-fill", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const name = (f.properties as { normalized_name?: string }).normalized_name ?? "";
          const data = STATE_DESERTS.find((d) => d.state === name);
          if (!data) return;
          onStateClick?.(data);
        });

        layersAddedRef.current = true;
        setProgress("ready");

        // Force a resize in case the container dimensions resolved late
        requestAnimationFrame(() => map.resize());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load map data");
      }
    };

    map.on("style.load", addLayers);
    map.on("load", addLayers);

    mapRef.current = map;
    // Force initial resize after mount
    requestAnimationFrame(() => map.resize());
    setTimeout(() => map.resize(), 200);

    // Keep map sized correctly when its container resizes
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      layersAddedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recolor + reveal popup on specialty change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || progress !== "ready") return;
    const expr = colorExpression(specialty);
    if (map.getLayer("states-fill")) map.setPaintProperty("states-fill", "fill-color", expr);
    if (map.getLayer("states-glow")) map.setPaintProperty("states-glow", "fill-color", expr);
    popupRef.current?.remove();
  }, [specialty, progress]);

  // Selected-state feature state + popup
  const lastSelectedRef = useRef<number | string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || progress !== "ready") return;

    // Clear last
    if (lastSelectedRef.current !== null) {
      try {
        map.setFeatureState(
          { source: "states", id: lastSelectedRef.current },
          { selected: false },
        );
      } catch {
        /* ignore */
      }
    }
    popupRef.current?.remove();

    if (!selectedState) {
      lastSelectedRef.current = null;
      return;
    }

    // Find the feature for this state
    const features = map.querySourceFeatures("states");
    const match = features.find(
      (f) => (f.properties as { normalized_name?: string }).normalized_name === selectedState.state,
    );
    if (match?.id !== undefined && match.id !== null) {
      map.setFeatureState({ source: "states", id: match.id }, { selected: true });
      lastSelectedRef.current = match.id;
    }

    // Pop up
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      offset: 10,
      className: "aarogya-popup",
      maxWidth: "260px",
    })
      .setLngLat(selectedState.centroid)
      .setHTML(popupHtml(selectedState, specialty))
      .addTo(map);

    // Smooth fly
    map.flyTo({ center: selectedState.centroid, zoom: 5, speed: 0.9, curve: 1.4 });
  }, [selectedState, specialty, progress]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
      {progress !== "ready" && !error && <LoadingOverlay phase={progress} />}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-surface/95 px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-destructive">Map failed to load</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingOverlay({ phase }: { phase: "booting" | "loading" }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-gradient-to-br from-surface/80 to-surface/40 backdrop-blur-sm">
      <div className="text-center">
        <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-[mapload_1.4s_ease-in-out_infinite] bg-primary" />
        </div>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {phase === "booting" ? "Initializing tiles…" : "Loading India boundaries…"}
        </p>
      </div>
      <style>{`@keyframes mapload { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
    </div>
  );
}

function popupHtml(d: StateDesert, specialty: Specialty): string {
  const score = desertScoreFor(d, specialty);
  const verified = verifiedCountFor(d, specialty);
  const color = scoreToColor(score);
  const label = specialty === "overall" ? "Overall coverage" : `${cap(specialty)} care`;
  return `
    <div style="font-family:'IBM Plex Sans',system-ui;min-width:220px;padding:2px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="width:6px;height:6px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px ${color}22;"></span>
        <p style="margin:0;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#64748b;font-family:'IBM Plex Mono',monospace;">${label}</p>
      </div>
      <h4 style="margin:6px 0 10px;font-size:16px;font-weight:600;color:#0f172a;letter-spacing:-0.01em;">${d.state}</h4>
      <div style="display:grid;grid-template-columns:1fr auto;row-gap:6px;column-gap:14px;font-size:12px;color:#0f172a;">
        <span style="color:#64748b;">Desert score</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-weight:600;color:${color};">${score}</span>
        <span style="color:#64748b;">Verified</span>
        <span style="font-family:'IBM Plex Mono',monospace;">${verified}</span>
        <span style="color:#64748b;">Avg trust</span>
        <span style="font-family:'IBM Plex Mono',monospace;">${d.avg_trust_score}</span>
        ${d.flagged_facilities > 0 ? `<span style="color:#dc2626;">Flags</span><span style="font-family:'IBM Plex Mono',monospace;color:#dc2626;font-weight:600;">${d.flagged_facilities}</span>` : ""}
      </div>
      ${d.nearest_alternative_km ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;display:flex;justify-content:space-between;"><span>Nearest alt.</span><span style="font-family:'IBM Plex Mono',monospace;color:#0f172a;">${d.nearest_alternative_km} km</span></div>` : ""}
    </div>
  `;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
