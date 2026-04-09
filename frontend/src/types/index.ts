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

export interface LayoutResponse {
  rooms: Room[];
  dimensions: Dimensions;
  building_width: number;
  building_length: number;
  floors: number;
  coverage: number;
  compliance_report: "PASS" | "FAIL";
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

export interface InterpretResponse {
  params: AIParams;
  raw_text: string;
  interpreted: AIInterpretation;
  llm?: LLMInfo;
}
