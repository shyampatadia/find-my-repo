/**
 * State-level desert intelligence (mock).
 * Real backend will return this from `GET /api/map/deserts?specialty=...`
 * sourced from the `desert_map` Delta table aggregated by state.
 *
 * Coordinates are approximate state centroids — used for label placement
 * and for the "worst 10 deserts" side panel.
 */

export type Specialty =
  | "overall"
  | "cardiac"
  | "dialysis"
  | "neonatal"
  | "oncology"
  | "trauma"
  | "obstetric"
  | "surgery";

export interface StateDesert {
  state: string;
  iso: string; // matches feature.properties.iso (state ISO 3166-2 code)
  centroid: [number, number]; // [lng, lat]
  total_facilities: number;
  avg_trust_score: number;
  desert_score: number; // 0-100, higher = worse
  flagged_facilities: number;
  coverage_status: "critical" | "high_risk" | "moderate" | "covered";
  // per-specialty desert scores (0-100, higher = worse)
  by_specialty: Record<Exclude<Specialty, "overall">, number>;
  verified_counts: Record<Exclude<Specialty, "overall">, number>;
  nearest_alternative_km?: number;
}

export const SPECIALTIES: { id: Specialty; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "cardiac", label: "Cardiac" },
  { id: "dialysis", label: "Dialysis" },
  { id: "neonatal", label: "Neonatal" },
  { id: "oncology", label: "Oncology" },
  { id: "trauma", label: "Trauma" },
  { id: "obstetric", label: "Obstetric" },
  { id: "surgery", label: "Surgery" },
];

// Helper to keep mock data terse
const s = (
  cardiac: number,
  dialysis: number,
  neonatal: number,
  oncology: number,
  trauma: number,
  obstetric: number,
  surgery: number,
) => ({ cardiac, dialysis, neonatal, oncology, trauma, obstetric, surgery });

const v = (
  cardiac: number,
  dialysis: number,
  neonatal: number,
  oncology: number,
  trauma: number,
  obstetric: number,
  surgery: number,
) => ({ cardiac, dialysis, neonatal, oncology, trauma, obstetric, surgery });

const statusFromScore = (n: number): StateDesert["coverage_status"] =>
  n >= 75 ? "critical" : n >= 55 ? "high_risk" : n >= 35 ? "moderate" : "covered";

const make = (
  state: string,
  iso: string,
  centroid: [number, number],
  desert_score: number,
  total_facilities: number,
  avg_trust_score: number,
  flagged_facilities: number,
  by_specialty: StateDesert["by_specialty"],
  verified_counts: StateDesert["verified_counts"],
  nearest_alternative_km?: number,
): StateDesert => ({
  state,
  iso,
  centroid,
  total_facilities,
  avg_trust_score,
  desert_score,
  flagged_facilities,
  coverage_status: statusFromScore(desert_score),
  by_specialty,
  verified_counts,
  nearest_alternative_km,
});

export const STATE_DESERTS: StateDesert[] = [
  // Critical / high-risk (mostly central, eastern, north-eastern)
  make("Bihar", "IN-BR", [85.7, 25.7], 86, 612, 38, 58, s(92, 88, 78, 90, 70, 65, 72), v(3, 6, 18, 4, 22, 41, 28), 142),
  make("Jharkhand", "IN-JH", [85.3, 23.6], 84, 318, 41, 31, s(89, 82, 81, 86, 74, 68, 70), v(4, 9, 14, 5, 18, 26, 22), 112),
  make("Chhattisgarh", "IN-CT", [82.0, 21.3], 81, 244, 43, 24, s(85, 80, 76, 82, 71, 64, 68), v(5, 8, 16, 6, 19, 30, 24), 128),
  make("Madhya Pradesh", "IN-MP", [78.0, 23.5], 78, 521, 46, 47, s(82, 76, 72, 79, 68, 60, 65), v(11, 18, 32, 13, 38, 62, 48), 95),
  make("Uttar Pradesh", "IN-UP", [80.9, 26.8], 76, 1142, 48, 98, s(80, 74, 70, 77, 65, 58, 62), v(28, 42, 76, 31, 88, 154, 118), 78),
  make("Odisha", "IN-OR", [85.1, 20.5], 74, 387, 49, 32, s(78, 72, 70, 76, 66, 60, 64), v(11, 16, 27, 12, 32, 52, 41), 88),
  make("Assam", "IN-AS", [92.9, 26.2], 73, 281, 50, 22, s(76, 71, 70, 74, 65, 58, 62), v(9, 13, 22, 11, 28, 45, 35), 110),
  make("Rajasthan", "IN-RJ", [73.8, 26.6], 70, 612, 52, 41, s(72, 68, 66, 71, 62, 55, 58), v(22, 31, 48, 24, 56, 92, 71), 72),

  // Moderate
  make("West Bengal", "IN-WB", [87.9, 23.0], 62, 738, 56, 38, s(64, 60, 58, 63, 55, 48, 52), v(34, 48, 76, 38, 84, 142, 108)),
  make("Telangana", "IN-TG", [79.0, 17.9], 58, 421, 60, 21, s(60, 56, 54, 59, 51, 45, 48), v(38, 51, 68, 42, 78, 124, 96)),
  make("Andhra Pradesh", "IN-AP", [80.0, 15.9], 56, 498, 61, 24, s(58, 54, 52, 57, 49, 43, 46), v(42, 58, 74, 46, 86, 138, 108)),
  make("Maharashtra", "IN-MH", [75.7, 19.4], 48, 1284, 65, 51, s(50, 46, 44, 49, 41, 36, 39), v(98, 132, 178, 108, 198, 284, 232)),
  make("Punjab", "IN-PB", [75.3, 30.9], 44, 312, 67, 14, s(46, 42, 40, 45, 38, 32, 35), v(38, 51, 64, 42, 72, 108, 88)),
  make("Haryana", "IN-HR", [76.3, 29.1], 42, 248, 68, 11, s(44, 40, 38, 43, 36, 30, 33), v(34, 46, 58, 38, 64, 96, 78)),
  make("Gujarat", "IN-GJ", [71.6, 22.7], 40, 658, 69, 22, s(42, 38, 36, 41, 34, 28, 31), v(72, 96, 122, 78, 134, 198, 162)),
  make("Karnataka", "IN-KA", [76.0, 14.9], 38, 712, 71, 18, s(40, 36, 34, 39, 32, 26, 29), v(82, 108, 138, 88, 152, 224, 184)),
  make("Tamil Nadu", "IN-TN", [78.5, 11.0], 32, 1024, 74, 21, s(34, 30, 28, 33, 26, 22, 24), v(124, 162, 208, 132, 228, 332, 274)),
  make("Kerala", "IN-KL", [76.3, 10.5], 24, 612, 78, 8, s(26, 22, 20, 25, 18, 14, 17), v(82, 108, 138, 88, 152, 224, 184)),
  make("Goa", "IN-GA", [74.0, 15.5], 22, 48, 79, 1, s(24, 20, 18, 23, 16, 12, 15), v(8, 11, 14, 9, 16, 22, 18)),

  // Smaller / UTs
  make("Delhi", "IN-DL", [77.2, 28.6], 18, 312, 81, 6, s(20, 16, 14, 19, 12, 8, 11), v(58, 76, 96, 62, 108, 158, 128)),
  make("Himachal Pradesh", "IN-HP", [77.2, 31.7], 52, 142, 62, 8, s(54, 50, 48, 53, 45, 39, 42), v(14, 19, 24, 16, 28, 42, 34)),
  make("Uttarakhand", "IN-UT", [79.0, 30.1], 60, 168, 58, 11, s(62, 58, 56, 61, 53, 47, 50), v(13, 18, 23, 15, 27, 40, 32)),
  make("Jammu and Kashmir", "IN-JK", [75.3, 33.5], 64, 142, 56, 12, s(66, 62, 60, 65, 57, 50, 54), v(11, 15, 19, 13, 22, 34, 27)),
  make("Ladakh", "IN-LA", [77.5, 34.2], 78, 14, 44, 2, s(82, 78, 76, 80, 72, 65, 68), v(1, 2, 2, 1, 3, 4, 3), 220),
  make("Manipur", "IN-MN", [93.9, 24.7], 71, 62, 51, 5, s(73, 69, 68, 72, 64, 58, 61), v(4, 6, 8, 5, 10, 16, 12)),
  make("Meghalaya", "IN-ML", [91.4, 25.6], 72, 48, 50, 4, s(74, 70, 68, 73, 65, 58, 62), v(3, 5, 6, 4, 8, 12, 10)),
  make("Mizoram", "IN-MZ", [92.9, 23.4], 70, 32, 52, 3, s(72, 68, 66, 71, 63, 56, 60), v(2, 3, 4, 3, 6, 9, 7)),
  make("Nagaland", "IN-NL", [94.6, 26.1], 73, 38, 50, 4, s(75, 71, 70, 74, 66, 59, 63), v(2, 3, 4, 3, 6, 10, 8)),
  make("Tripura", "IN-TR", [91.7, 23.9], 68, 52, 53, 4, s(70, 66, 64, 69, 61, 54, 58), v(3, 4, 6, 4, 8, 12, 10)),
  make("Arunachal Pradesh", "IN-AR", [94.7, 28.0], 80, 28, 45, 3, s(83, 79, 77, 81, 73, 66, 70), v(1, 2, 3, 2, 4, 7, 5), 180),
  make("Sikkim", "IN-SK", [88.5, 27.5], 50, 28, 63, 2, s(52, 48, 46, 51, 43, 37, 40), v(3, 4, 5, 3, 7, 11, 9)),
  make("Chandigarh", "IN-CH", [76.8, 30.7], 20, 38, 80, 1, s(22, 18, 16, 21, 14, 10, 13), v(8, 11, 14, 9, 16, 22, 18)),
  make("Puducherry", "IN-PY", [79.8, 11.9], 30, 42, 75, 2, s(32, 28, 26, 31, 24, 20, 22), v(7, 10, 13, 8, 15, 22, 18)),
  make("Andaman and Nicobar", "IN-AN", [92.7, 11.7], 76, 18, 47, 2, s(78, 74, 72, 77, 69, 62, 66), v(1, 2, 3, 2, 4, 6, 5), 1340),
  make("Dadra and Nagar Haveli and Daman and Diu", "IN-DN", [73.0, 20.4], 38, 22, 70, 1, s(40, 36, 34, 39, 32, 26, 29), v(3, 4, 5, 3, 7, 10, 8)),
  make("Lakshadweep", "IN-LD", [72.6, 10.6], 82, 8, 42, 1, s(85, 80, 78, 83, 75, 68, 72), v(0, 1, 1, 1, 2, 3, 2), 410),
];

export function desertScoreFor(d: StateDesert, specialty: Specialty): number {
  if (specialty === "overall") return d.desert_score;
  return d.by_specialty[specialty];
}

export function verifiedCountFor(d: StateDesert, specialty: Specialty): number {
  if (specialty === "overall") return d.total_facilities;
  return d.verified_counts[specialty];
}
