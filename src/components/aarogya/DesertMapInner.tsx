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
  "Arunanchal Pradesh": "Arunachal Pradesh",
  "Dadara & Nagar Havelli": "Dadra and Nagar Haveli and Daman and Diu",
  "Dadra and Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu & Kashmir": "Jammu and Kashmir",
  "NCT of Delhi": "Delhi",
};

function normalize(name: string | undefined | null): string {
  if (!name) return "";
  return NAME_ALIASES[name] ?? name;
}

function scoreToColor(score: number): string {
  if (score >= 75) return "#dc2626";
  if (score >= 55) return "#ea580c";
  if (score >= 35) return "#ca8a04";
  if (score >= 20) return "#16a34a";
  return "#0d9488";
}

function colorExpression(specialty: Specialty): ExpressionSpecification {
  const pairs: (string | string[])[] = [];
  for (const d of STATE_DESERTS) {
    pairs.push(d.state, scoreToColor(desertScoreFor(d, specialty)));
  }
  return ["match", ["get", "normalized_name"], ...pairs, "#e5e7eb"] as unknown as ExpressionSpecification;
}

export default function DesertMapInner({ specialty, selectedState, onStateClick }: DesertMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) {
      setError("Mapbox token missing.");
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
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const addLayers = async () => {
      try {
        const res = await fetch(INDIA_STATES_GEOJSON);
        const raw = (await res.json()) as GeoJSON.FeatureCollection;
        const features = raw.features.map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            normalized_name: normalize(
              ((f.properties as Record<string, unknown> | null)?.NAME_1 as string | undefined) ??
                ((f.properties as Record<string, unknown> | null)?.ST_NM as string | undefined),
            ),
          },
        }));

        if (map.getSource("states")) return;
        map.addSource("states", {
          type: "geojson",
          data: { ...raw, features } as GeoJSON.FeatureCollection,
          generateId: true,
        });
        map.addLayer({
          id: "states-fill",
          type: "fill",
          source: "states",
          paint: {
            "fill-color": colorExpression(specialty),
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "selected"], false], 0.95,
              ["boolean", ["feature-state", "hover"], false], 0.88,
              0.72,
            ],
          },
        });
        map.addLayer({
          id: "states-outline",
          type: "line",
          source: "states",
          paint: {
            "line-color": ["case", ["boolean", ["feature-state", "selected"], false], "#0f172a", "#ffffff"],
            "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.4, 0.6],
          },
        });

        let hoveredId: number | string | null = null;
        map.on("mousemove", "states-fill", (e) => {
          if (!e.features?.length) return;
          if (hoveredId !== null) map.setFeatureState({ source: "states", id: hoveredId }, { hover: false });
          hoveredId = e.features[0].id ?? null;
          if (hoveredId !== null) map.setFeatureState({ source: "states", id: hoveredId }, { hover: true });
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "states-fill", () => {
          if (hoveredId !== null) map.setFeatureState({ source: "states", id: hoveredId }, { hover: false });
          hoveredId = null;
          map.getCanvas().style.cursor = "";
        });
        map.on("click", "states-fill", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const name = (f.properties as { normalized_name?: string }).normalized_name ?? "";
          const data = STATE_DESERTS.find((d) => d.state === name);
          if (data) onStateClick?.(data);
        });

        setReady(true);
        requestAnimationFrame(() => map.resize());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    };

    if (map.isStyleLoaded()) addLayers();
    else map.once("load", addLayers);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
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
    const expr = colorExpression(specialty);
    if (map.getLayer("states-fill")) map.setPaintProperty("states-fill", "fill-color", expr);
    popupRef.current?.remove();
  }, [specialty, ready]);

  // Selected state
  const lastSelectedRef = useRef<number | string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (lastSelectedRef.current !== null) {
      try { map.setFeatureState({ source: "states", id: lastSelectedRef.current }, { selected: false }); } catch {}
    }
    popupRef.current?.remove();
    if (!selectedState) { lastSelectedRef.current = null; return; }
    const features = map.querySourceFeatures("states");
    const match = features.find((f) => (f.properties as { normalized_name?: string }).normalized_name === selectedState.state);
    if (match?.id !== undefined && match.id !== null) {
      map.setFeatureState({ source: "states", id: match.id }, { selected: true });
      lastSelectedRef.current = match.id;
    }
    popupRef.current = new mapboxgl.Popup({ closeButton: false, offset: 10, className: "aarogya-popup", maxWidth: "260px" })
      .setLngLat(selectedState.centroid)
      .setHTML(popupHtml(selectedState, specialty))
      .addTo(map);
    map.flyTo({ center: selectedState.centroid, zoom: 5, speed: 0.9 });
  }, [selectedState, specialty, ready]);

  if (error) {
    return (
      <div className="grid h-full w-full place-items-center bg-surface-muted px-6 text-center">
        <div>
          <p className="text-sm font-semibold text-destructive">Map failed to load</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  return <div ref={containerRef} className="h-full w-full" />;
}

function popupHtml(d: StateDesert, specialty: Specialty): string {
  const score = desertScoreFor(d, specialty);
  const verified = verifiedCountFor(d, specialty);
  const color = scoreToColor(score);
  const label = specialty === "overall" ? "Overall coverage" : `${specialty.charAt(0).toUpperCase() + specialty.slice(1)} care`;
  return `
    <div style="font-family:'IBM Plex Sans',system-ui;min-width:220px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="width:6px;height:6px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px ${color}22;"></span>
        <p style="margin:0;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#64748b;font-family:'IBM Plex Mono',monospace;">${label}</p>
      </div>
      <h4 style="margin:6px 0 10px;font-size:16px;font-weight:600;color:#0f172a;">${d.state}</h4>
      <div style="display:grid;grid-template-columns:1fr auto;row-gap:6px;column-gap:14px;font-size:12px;color:#0f172a;">
        <span style="color:#64748b;">Desert score</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-weight:600;color:${color};">${score}</span>
        <span style="color:#64748b;">Verified</span>
        <span style="font-family:'IBM Plex Mono',monospace;">${verified}</span>
        <span style="color:#64748b;">Avg trust</span>
        <span style="font-family:'IBM Plex Mono',monospace;">${d.avg_trust_score}</span>
        ${d.flagged_facilities > 0 ? `<span style="color:#dc2626;">Flags</span><span style="font-family:'IBM Plex Mono',monospace;color:#dc2626;font-weight:600;">${d.flagged_facilities}</span>` : ""}
      </div>
    </div>
  `;
}
