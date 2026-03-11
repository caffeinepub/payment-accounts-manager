/**
 * Monthly Profit Storage
 *
 * Stores a persistent snapshot of Comm Prakash profit per calendar month.
 * This ensures profit data survives entry deletions.
 *
 * Key: "monthlyProfitSnapshot"
 * Value: Record<monthKey (YYYY-MM), { label: string; total: number }>
 *
 * Auto-reset: entries from March 2027+ are cleared when that month is reached.
 */

const SNAPSHOT_KEY = "monthlyProfitSnapshot";
const RESET_YEAR = 2027;
const RESET_MONTH = 3; // March (1-indexed)

export interface MonthlyProfitEntry {
  label: string;
  total: number;
}

function getSnapshot(): Record<string, MonthlyProfitEntry> {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MonthlyProfitEntry>;
  } catch {
    return {};
  }
}

function saveSnapshot(snapshot: Record<string, MonthlyProfitEntry>): void {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

/**
 * Add or update profit for a specific month.
 * delta can be positive (adding) or negative (subtracting).
 */
export function applyProfitDelta(
  monthKey: string,
  monthLabel: string,
  delta: number,
): void {
  const snapshot = getSnapshot();
  const existing = snapshot[monthKey];
  const newTotal = (existing?.total ?? 0) + delta;
  if (newTotal <= 0) {
    // Remove months with zero or negative total to keep data clean
    delete snapshot[monthKey];
  } else {
    snapshot[monthKey] = { label: monthLabel, total: newTotal };
  }
  saveSnapshot(snapshot);
}

/**
 * Set profit for a specific month to an exact value.
 * Used when rebuilding the snapshot from scratch (e.g. on login).
 */
export function setProfitForMonth(
  monthKey: string,
  monthLabel: string,
  total: number,
): void {
  const snapshot = getSnapshot();
  if (total <= 0) {
    delete snapshot[monthKey];
  } else {
    snapshot[monthKey] = { label: monthLabel, total };
  }
  saveSnapshot(snapshot);
}

/**
 * Delete a specific month's profit entry manually.
 */
export function deleteProfitMonth(monthKey: string): void {
  const snapshot = getSnapshot();
  delete snapshot[monthKey];
  saveSnapshot(snapshot);
}

/**
 * Get all monthly profit rows sorted chronologically.
 * Also performs auto-reset: removes months >= March 2027 once that date is reached.
 */
export function getMonthlyProfitRows(): Array<{
  monthKey: string;
  monthLabel: string;
  totalCommPrakash: number;
}> {
  const snapshot = getSnapshot();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  // Auto-reset: if we're in or past March 2027, remove those months
  const isResetTime =
    currentYear > RESET_YEAR ||
    (currentYear === RESET_YEAR && currentMonth >= RESET_MONTH);

  if (isResetTime) {
    let changed = false;
    for (const key of Object.keys(snapshot)) {
      const [yr, mo] = key.split("-").map(Number);
      const isResetMonth =
        yr > RESET_YEAR || (yr === RESET_YEAR && mo >= RESET_MONTH);
      if (isResetMonth) {
        delete snapshot[key];
        changed = true;
      }
    }
    if (changed) saveSnapshot(snapshot);
  }

  return Object.entries(snapshot)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, { label, total }]) => ({
      monthKey,
      monthLabel: label,
      totalCommPrakash: total,
    }));
}

/**
 * Rebuild the entire monthly profit snapshot from current entries + split map.
 * Call this after fetching entries from backend to ensure consistency.
 */
export function rebuildSnapshotFromEntries(
  entries: Array<{ id: string; dateCreated: bigint }>,
  splitMap: Record<string, { commPrakash: string }>,
): void {
  const freshSnapshot: Record<string, MonthlyProfitEntry> = {};

  for (const entry of entries) {
    const ms = Number(entry.dateCreated) / 1_000_000;
    const date = new Date(ms);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });

    const split = splitMap[entry.id];
    const commPrakashAmt = split
      ? Number.parseFloat(split.commPrakash) || 0
      : 0;
    if (commPrakashAmt <= 0) continue;

    const existing = freshSnapshot[monthKey];
    freshSnapshot[monthKey] = {
      label: monthLabel,
      total: (existing?.total ?? 0) + commPrakashAmt,
    };
  }

  // Merge: keep deleted-entry history (keys not in fresh), update existing ones
  // Strategy: fresh snapshot wins for months that have active entries,
  // but preserve months that exist in storage but not in fresh (deleted entries).
  const stored = getSnapshot();
  const merged: Record<string, MonthlyProfitEntry> = { ...stored };

  // For months present in fresh, update to fresh value
  for (const [key, val] of Object.entries(freshSnapshot)) {
    merged[key] = val;
  }

  saveSnapshot(merged);
}
