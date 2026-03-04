const STORAGE_KEY = "commissionTypeMap";

export type CommissionType = "Comm Prakash" | "Comm Other";

export function getCommissionTypeMap(): Record<string, CommissionType> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CommissionType>;
  } catch {
    return {};
  }
}

export function setCommissionType(id: string, type: CommissionType): void {
  const map = getCommissionTypeMap();
  map[id] = type;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function removeCommissionType(id: string): void {
  const map = getCommissionTypeMap();
  delete map[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getCommissionType(id: string): CommissionType {
  const map = getCommissionTypeMap();
  return map[id] ?? "Comm Prakash";
}
