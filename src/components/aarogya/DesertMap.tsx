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

// Public India states GeoJSON (Datameet / public domain).
// State names live in feature.properties.NAME_1 (varies by source — we normalize).
const INDIA_STATES_GEOJSON =
  "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States";

interface DesertMapProps {
  specialty: Specialty;
  onStateClick?: (state: StateDesert) => void;
}

// Map GeoJSON state names → our STATE_DESERTS state names
const NAME_ALIASES: Record<string, string> = {
  "Andaman & Nicobar Island": "Andaman and Nicobar",
  "Andaman and Nicobar Islands": "Andaman and Nicobar",
  "Arunanchal Pradesh": "Arunachal Pradesh",
  "Dadara & Nagar Havelli": "Dadra and Nagar Haveli and Daman and Diu",
  "Dadra and Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu & Kashmir": "Jammu and Kashmir",
  "NCT of Delhi": "Delhi",
  "Telangana": "Telangana",
};

function normalize(name: string | undefined): string {
  if (!name) return "";
  return NAME_ALIASES[name] ?? name;
}

// Trust gradient mapped to desert score (inverted: higher desert = redder)
function colorExpression(specialty: Specialty): ExpressionSpecification {
  // Build a [match, ['get', 'normalized_name'], ...pairs, default] expression
  const pairs: (string | string[])[] = [];
  for (const d of STATE_DESERTS) {
    const score = desertScoreFor(d, specialty);
    pairs.push(d.state, scoreToColor(score));
  }
  return [
    "match",
    ["get", "normalized_name"],
    ...pairs,
    "#e5e7eb", // default: light gray for unknown states
  ] as unknown as ExpressionSpecification;
}

function scoreToColor(score: number): string {
  // Match the trust palette but inverted (high desert = red)
  if (score >= 75) return "oklch(0.56 0.21 27)"; // critical
  if (score >= 55) return "oklch(0.68 0.17 50)"; // high risk
  if (score >= 35) return "oklch(0.78 0.15 85)"; // moderate
  if (score >= 20) return "oklch(0.62 0.14 155)"; // covered
  return "oklch(0.5 0.13 175)"; // strongly covered
}

export function DesertMap({ specialty, onStateClick }: DesertMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Init map once
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
      center: [82.0, 22.5],
      zoom: 3.6,
      maxZoom: 7,
      minZoom: 3,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", async () => {
      try {
        const res = await fetch(INDIA_STATES_GEOJSON);
        if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`);
        const raw = (await res.json()) as GeoJSON.FeatureCollection;

        // Normalize names into a stable property
        const features = raw.features.map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            normalized_name: normalize(
              (f.properties as { NAME_1?: string; ST_NM?: string; st_nm?: string } | null)?.NAME_1 ??
                (f.properties as { ST_NM?: string } | null)?.ST_NM ??
                (f.properties as { st_nm?: string } | null)?.st_nm,
            ),
          },
        }));
        const data: GeoJSON.FeatureCollection = { ...raw, features };

        map.addSource("states", { type: "geojson", data, generateId: true });

        map.addLayer({
          id: "states-fill",
          type: "fill",
          source: "states",
          paint: {
            "fill-color": colorExpression(specialty),
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.92,
              0.78,
            ],
          },
        });

        map.addLayer({
          id: "states-outline",
          type: "line",
          source: "states",
          paint: {
            "line-color": "#ffffff",
            "line-width": 0.6,
          },
        });

        // Hover state
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

        // Click → popup + callback
        map.on("click", "states-fill", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const name = (f.properties as { normalized_name?: string }).normalized_name ?? "";
          const data = STATE_DESERTS.find((d) => d.state === name);
          if (!data) return;

          popupRef.current?.remove();
          popupRef.current = new mapboxgl.Popup({
            closeButton: false,
            offset: 8,
            className: "aarogya-popup",
          })
            .setLngLat(e.lngLat)
            .setHTML(popupHtml(data, specialty))
            .addTo(map);

          onStateClick?.(data);
        });

        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load map data");
      }
    });

    mapRef.current = map;
    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recolor on specialty change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (map.getLayer("states-fill")) {
      map.setPaintProperty("states-fill", "fill-color", colorExpression(specialty));
    }
    popupRef.current?.remove();
  }, [specialty, ready]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {!ready && !error && (
        <div className="absolute inset-0 grid place-items-center bg-surface/60 backdrop-blur-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Loading India boundaries…
          </p>
        </div>
      )}
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

function popupHtml(d: StateDesert, specialty: Specialty): string {
  const score = desertScoreFor(d, specialty);
  const verified = verifiedCountFor(d, specialty);
  const specialtyLabel = specialty === "overall" ? "Overall coverage" : `${cap(specialty)} care`;
  return `
    <div style="font-family: 'IBM Plex Sans', system-ui; min-width: 220px;">
      <p style="margin:0; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: oklch(0.48 0.02 230); font-family: 'IBM Plex Mono', monospace;">${specialtyLabel}</p>
      <h4 style="margin:4px 0 8px; font-size:15px; font-weight:600; color:oklch(0.18 0.02 230);">${d.state}</h4>
      <div style="display:flex; justify-content:space-between; gap:12px; font-size:12px; color:oklch(0.18 0.02 230);">
        <span style="color:oklch(0.48 0.02 230);">Desert score</span>
        <span style="font-family: 'IBM Plex Mono', monospace; font-weight:600; color:${scoreToColor(score)};">${score}</span>
      </div>
      <div style="display:flex; justify-content:space-between; gap:12px; font-size:12px; color:oklch(0.18 0.02 230); margin-top:4px;">
        <span style="color:oklch(0.48 0.02 230);">Verified facilities</span>
        <span style="font-family: 'IBM Plex Mono', monospace;">${verified}</span>
      </div>
      <div style="display:flex; justify-content:space-between; gap:12px; font-size:12px; color:oklch(0.18 0.02 230); margin-top:4px;">
        <span style="color:oklch(0.48 0.02 230);">Avg trust</span>
        <span style="font-family: 'IBM Plex Mono', monospace;">${d.avg_trust_score}</span>
      </div>
      ${d.flagged_facilities > 0 ? `<div style="display:flex; justify-content:space-between; gap:12px; font-size:12px; color:oklch(0.56 0.21 27); margin-top:4px;"><span>Contradiction flags</span><span style="font-family: 'IBM Plex Mono', monospace; font-weight:600;">${d.flagged_facilities}</span></div>` : ""}
      ${d.nearest_alternative_km ? `<p style="margin: 8px 0 0; padding-top:8px; border-top: 1px solid oklch(0.91 0.008 220); font-size:11px; color:oklch(0.48 0.02 230);">Nearest alternative · <span style="font-family: 'IBM Plex Mono', monospace; color:oklch(0.18 0.02 230);">${d.nearest_alternative_km} km</span></p>` : ""}
    </div>
  `;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
