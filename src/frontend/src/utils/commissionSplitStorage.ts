const SPLIT_KEY = "commissionSplitMap";

export interface CommissionSplit {
  commPrakash: string;
  commOthers: string;
  advance: string;
}

function getSplitMap(): Record<string, CommissionSplit> {
  try {
    const raw = localStorage.getItem(SPLIT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CommissionSplit>;
  } catch {
    return {};
  }
}

export function getCommissionSplit(id: string): CommissionSplit {
  const map = getSplitMap();
  return map[id] ?? { commPrakash: "", commOthers: "", advance: "" };
}

export function setCommissionSplit(id: string, split: CommissionSplit): void {
  const map = getSplitMap();
  map[id] = {
    commPrakash: split.commPrakash,
    commOthers: split.commOthers,
    advance: split.advance ?? "",
  };
  localStorage.setItem(SPLIT_KEY, JSON.stringify(map));
}

export function removeCommissionSplit(id: string): void {
  const map = getSplitMap();
  delete map[id];
  localStorage.setItem(SPLIT_KEY, JSON.stringify(map));
}

export function getCommissionSplitMap(): Record<string, CommissionSplit> {
  return getSplitMap();
}
