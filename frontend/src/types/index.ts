// ------------------------------------------------
// Types - Architect.ai
// ------------------------------------------------

export interface Room {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

export interface Dimensions {
  plot_width: number;
  plot_length: number;
  building_width: number;
  building_length: number;
  total_floor_area: number;
  setback: number;
  floors: number;
}

export interface LayoutData {
  rooms: Room[];
  dimensions: Dimensions;
  building_width: number;
  building_length: number;
  floors: number;
}

/* Keep legacy LayoutResponse for backward compatibility */
export interface LayoutResponse extends LayoutData {
  coverage: number;
  compliance_report: "PASS" | "WARNING" | "FAIL";
  violations: string[];
}

export interface BuildingInput {
  plot_width: number;
  plot_length: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  kitchen: boolean;
}

export interface AIParams {
  plot_width: number;
  plot_length: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  kitchen: boolean;
  building_type: string;
  parking: boolean;
}

export interface AIInterpretation {
  plot_size: string;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  kitchen: boolean;
  building_type: string;
  parking: boolean;
}

export interface LLMInfo {
  provider: string;
  model: string;
}

/* Legacy interpret response */
export interface InterpretResponse {
  params: AIParams;
  raw_text: string;
  interpreted: AIInterpretation;
  llm?: LLMInfo;
}

// ------------------------------------------------
// New unified types for real zoning data
// ------------------------------------------------

export interface ZoneInfo {
  zone_code: string;
  zone_name: string;
  city: string;
  authority: string;
  source: string;
}

export interface ZoningRule {
  rule_name: string;
  limit: number | string;
  actual: number | string;
  unit: string;
  status: "OK" | "WARNING" | "VIOLATION";
  message: string;
}

export interface RulesApplied {
  max_fsi: number;
  max_floors: number;
  max_height_m: number;
  min_setback_front_m: number;
  min_setback_side_m: number;
  min_setback_rear_m: number;
  max_coverage_pct: number;
}

export interface ZoningReport {
  overall_status: "PASS" | "WARNING" | "FAIL";
  violations: string[];
  coverage: number;
  fsi: number;
  building_height: number;
  setback_x: number;
  setback_y: number;
  zone_info: ZoneInfo | null;
  rules: ZoningRule[];
  rules_applied: RulesApplied;
}

export interface UnifiedResponse {
  params: AIParams;
  interpreted: AIInterpretation;
  llm: LLMInfo;
  layout: LayoutData;
  zoning: ZoningReport;
}

export interface AddressData {
  address: string;
  lat: number;
  lng: number;
}
