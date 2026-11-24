export type UserRole = "admin" | "patient";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  facility: string;
}

export type BatchStatus = "active" | "quarantined" | "depleted";
export type StockVelocity = "fast" | "medium" | "slow";

export interface InventoryBatch {
  id: string;
  batchId: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category:
    | "Biologics & Insulin"
    | "Vaccines"
    | "Cardiology"
    | "Antibiotics"
    | "Analgesics"
    | "Oncology"
    | "Respiratory";
  manufactureDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  reorderPoint: number;
  unitPrice: number; // INR
  shelfZoneId: string;
  shelfZoneLabel: string;
  status: BatchStatus;
  velocity: StockVelocity;
}

export interface TelemetryPoint {
  time: string;
  temp: number;
  humidity: number;
}

export interface StorageZone {
  id: string;
  name: string;
  code: string;
  minTemp: number;
  maxTemp: number;
  currentTemp: number;
  humidity: number;
  maxHumidity: number;
  status: "optimal" | "warning" | "breach";
  breachReason?: string;
  telemetry: TelemetryPoint[];
}

export interface Supplier {
  id: string;
  name: string;
  city: string;
  distanceKm: number;
  estDeliveryHours: number;
  unitPriceMultiplier: number; // lower is better (e.g. 0.92 vs 1.08)
  aiTrustScore: number; // 0-100
  coldChainCertified: boolean;
  specialties: string[];
  activeContracts: number;
}

export interface RestockOrderItem {
  batchName: string;
  genericName: string;
  quantity: number;
  unitPrice: number;
  reason: string;
}

export interface RestockOrder {
  id: string;
  orderCode: string;
  supplierId: string;
  supplierName: string;
  items: RestockOrderItem[];
  totalCost: number;
  status: "Submitted" | "Dispatched" | "Cold-Chain Transit" | "Delivered";
  etaHours: number;
  createdAt: string;
}

export interface DosageSlot {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export interface PrescribedMedicine {
  id: string;
  name: string;
  composition: string;
  dosageText: string;
  frequency: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
  takenToday: DosageSlot;
  sideEffects: string[];
  storageTip: string;
  withFood: string;
}

export interface DigitalPrescription {
  id: string;
  rxCode: string;
  patientName: string;
  patientId: string;
  age: number;
  doctorName: string;
  hospital: string;
  issuedDate: string;
  validUntil: string;
  diagnosis: string;
  medications: PrescribedMedicine[];
}

export interface DemandForecastPoint {
  month: string;
  actual: number | null;
  forecast: number;
  seasonalIndex: number;
  coldChainDemand: number;
}

export interface VelocityMatrixPoint {
  name: string;
  category: string;
  monthlyTurnover: number;
  marginPercent: number;
  daysOfCover: number;
  quadrant: "Fast-Mover" | "Core Steady" | "Slow-Mover" | "Critical Watch";
}
