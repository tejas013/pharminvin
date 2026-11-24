import { StoredAccount } from "@/types/pharminvin";

export const USERS_STORAGE_KEY = "pharminvin_users_registry_v2";

export const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: "demo-admin-01",
    email: "dr.sharma@pharminvin.ai",
    password: "Pharminvin@2026",
    fullName: "Dr. Rohan Sharma, PharmD",
    role: "admin",
    facility: "Pharminvin Command Hub — Navi Mumbai",
    licenseId: "PHARM-MH-2026-001",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "demo-doctor-01",
    email: "dr.kulkarni@pharminvin.ai",
    password: "Doctor@2026",
    fullName: "Dr. Meera Kulkarni, MD",
    role: "doctor",
    facility: "Apollo Precision Care, Navi Mumbai",
    licenseId: "MCI-MH-48291",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "demo-patient-01",
    email: "aarav.deshmukh@patient.in",
    password: "Patient@2026",
    fullName: "Aarav Deshmukh",
    role: "patient",
    facility: "Patient Digital Care Portal",
    age: 42,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export function getStoredAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return DEFAULT_ACCOUNTS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw) as StoredAccount[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_ACCOUNTS;
    }

    // Ensure default demo accounts are always present alongside newly registered users
    const merged = [...parsed];
    for (const def of DEFAULT_ACCOUNTS) {
      if (!merged.some((u) => u.email.toLowerCase() === def.email.toLowerCase())) {
        merged.push(def);
      }
    }
    return merged;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveStoredAccount(newAccount: StoredAccount): StoredAccount[] {
  const existing = getStoredAccounts();
  const filtered = existing.filter(
    (u) => u.email.toLowerCase() !== newAccount.email.toLowerCase()
  );
  const updated = [newAccount, ...filtered];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota issues
    }
  }
  return updated;
}
