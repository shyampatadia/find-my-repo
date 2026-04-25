/**
 * API client for Aarogya Intelligence.
 *
 * Currently returns mock data shaped to match the real backend contract
 * (POST /api/query/crisis, GET /api/map/deserts, etc.). When the FastAPI
 * service is live, swap fetch URLs in one place and remove the mock layer.
 */

export type TrustLevel = "critical" | "low" | "medium" | "high" | "verified";

export interface ContradictionFlag {
  rule: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface EvidenceSentence {
  text: string;
  field: string;
  matched_capability: string;
}

export interface Facility {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  phone?: string;
  website?: string;
  trust_score: number;
  verified_capabilities: string[];
  contradiction_flags: ContradictionFlag[];
  evidence_sentences: EvidenceSentence[];
  doctor_count?: number;
  capacity?: number;
  facility_type?: string;
  tavily_verified?: boolean;
  tavily_news_snippet?: string;
}

export interface AgentTraceStep {
  node: string;
  status: "ok" | "retry" | "error";
  duration_ms: number;
  summary: string;
  detail?: string;
}

export interface DesertAlert {
  district: string;
  state: string;
  desert_score: number;
  missing_specialty: string;
  nearest_alternative_km: number;
}

export interface CrisisQueryResponse {
  trace_id: string;
  query: {
    raw: string;
    detected_language: string;
    parsed_specialty: string;
    parsed_location: string;
    urgency: "emergency" | "routine";
  };
  facilities: Facility[];
  desert_alerts: DesertAlert[];
  trace: AgentTraceStep[];
  total_ms: number;
}

export interface DesertDistrict {
  pincode: string;
  city: string;
  state: string;
  centroid_lat: number;
  centroid_lng: number;
  total_facilities: number;
  avg_trust_score: number;
  desert_score: number;
  coverage_status: "critical" | "high_risk" | "moderate" | "covered";
  verified_by_specialty: Record<string, number>;
}

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_FACILITIES: Facility[] = [
  {
    id: "fac_001",
    name: "Rajendra Institute of Medical Sciences",
    city: "Ranchi",
    state: "Jharkhand",
    pincode: "834009",
    latitude: 23.4126,
    longitude: 85.4364,
    distance_km: 4.2,
    phone: "+91-651-2451070",
    website: "https://rimsranchi.ac.in",
    trust_score: 88,
    verified_capabilities: [
      "Emergency C-section",
      "Obstetric care",
      "Neonatal ICU",
      "General surgery",
      "Anesthesia",
    ],
    contradiction_flags: [],
    evidence_sentences: [
      {
        text: "24/7 obstetric and gynecological emergency services with dedicated NICU support.",
        field: "description",
        matched_capability: "Emergency C-section",
      },
      {
        text: "Department of Anesthesiology operates 18 dedicated operating theaters.",
        field: "description",
        matched_capability: "Anesthesia",
      },
    ],
    doctor_count: 412,
    capacity: 1850,
    facility_type: "Government Medical College",
    tavily_verified: true,
    tavily_news_snippet: "RIMS Ranchi inaugurated new maternal health wing in March 2025.",
  },
  {
    id: "fac_002",
    name: "Sadar Hospital Ranchi",
    city: "Ranchi",
    state: "Jharkhand",
    pincode: "834001",
    latitude: 23.3645,
    longitude: 85.3245,
    distance_km: 8.7,
    phone: "+91-651-2200001",
    trust_score: 72,
    verified_capabilities: ["Obstetric care", "Emergency C-section", "General surgery"],
    contradiction_flags: [],
    evidence_sentences: [
      {
        text: "District-level obstetric facility with operative delivery capability.",
        field: "description",
        matched_capability: "Emergency C-section",
      },
    ],
    doctor_count: 64,
    capacity: 220,
    facility_type: "District Hospital",
    tavily_verified: true,
  },
  {
    id: "fac_003",
    name: "Apex Multispecialty Hospital",
    city: "Ranchi",
    state: "Jharkhand",
    pincode: "834002",
    latitude: 23.3801,
    longitude: 85.337,
    distance_km: 6.1,
    trust_score: 34,
    verified_capabilities: ["General consultation"],
    contradiction_flags: [
      {
        rule: "surgery_no_anesthesia",
        severity: "high",
        description: "Claims general surgery and ICU but lists zero doctors and no anesthesia capability.",
      },
      {
        rule: "multispecialty_zero_doctors",
        severity: "medium",
        description: "Claims 8 specialties but doctor count is 0.",
      },
    ],
    evidence_sentences: [],
    doctor_count: 0,
    facility_type: "Private Clinic",
    tavily_verified: false,
  },
];

const MOCK_TRACE: AgentTraceStep[] = [
  { node: "LanguageDetector", status: "ok", duration_ms: 42, summary: "Detected: en (1.0)" },
  { node: "QueryParser", status: "ok", duration_ms: 380, summary: "specialty=obstetric, location=Ranchi, urgency=emergency" },
  { node: "DatabricksRetriever", status: "ok", duration_ms: 210, summary: "Vector search → 25 candidates" },
  { node: "GeographicFilter", status: "ok", duration_ms: 8, summary: "Within 60km radius → 11 candidates" },
  { node: "TrustFilter", status: "ok", duration_ms: 4, summary: "Dropped 6 below trust 50" },
  { node: "CapabilityVerifier", status: "ok", duration_ms: 920, summary: "DSPy verified 3 of 5 candidates" },
  { node: "ContradictionCheck", status: "ok", duration_ms: 14, summary: "1 facility flagged" },
  { node: "DesertEscalator", status: "ok", duration_ms: 6, summary: "Sufficient results — no escalation" },
  { node: "TavilyEnricher", status: "ok", duration_ms: 740, summary: "Confirmed 2 facilities operational" },
  { node: "ResponseComposer", status: "ok", duration_ms: 22, summary: "Composed ranked response" },
];

const MOCK_DESERT_ALERTS: DesertAlert[] = [
  {
    district: "Palamu",
    state: "Jharkhand",
    desert_score: 89,
    missing_specialty: "Emergency obstetric",
    nearest_alternative_km: 112,
  },
  {
    district: "Latehar",
    state: "Jharkhand",
    desert_score: 84,
    missing_specialty: "Emergency obstetric",
    nearest_alternative_km: 98,
  },
];

// ─── API surface ───────────────────────────────────────────────────────────

const FAKE_LATENCY = 850;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function crisisQuery(query: string): Promise<CrisisQueryResponse> {
  await sleep(FAKE_LATENCY);
  return {
    trace_id: `tr_${Math.random().toString(36).slice(2, 10)}`,
    query: {
      raw: query,
      detected_language: "en",
      parsed_specialty: "obstetric",
      parsed_location: "Ranchi",
      urgency: "emergency",
    },
    facilities: MOCK_FACILITIES,
    desert_alerts: MOCK_DESERT_ALERTS,
    trace: MOCK_TRACE,
    total_ms: 2346,
  };
}

export async function listFacilities(): Promise<Facility[]> {
  await sleep(200);
  return MOCK_FACILITIES;
}

export function trustLevel(score: number): TrustLevel {
  if (score >= 85) return "verified";
  if (score >= 70) return "high";
  if (score >= 55) return "medium";
  if (score >= 40) return "low";
  return "critical";
}

export function trustLabel(score: number): string {
  const level = trustLevel(score);
  return {
    critical: "Critical risk",
    low: "Low trust",
    medium: "Moderate",
    high: "Verified",
    verified: "Highly verified",
  }[level];
}
