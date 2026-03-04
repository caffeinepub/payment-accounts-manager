import type { Entry } from "../backend.d";
import { getCommissionSplitMap } from "./commissionSplitStorage";
import { formatCurrency, formatDate } from "./currency";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportEntriesToExcel(
  entries: Entry[],
  commissionTypeMap: Record<string, string>,
  filename: string,
): void {
  const splitMap = getCommissionSplitMap();

  const headers = [
    "Name",
    "Mobile",
    "Amount",
    "Comm Prakash",
    "Comm Others",
    "Total Amount",
    "Paid",
    "Commission Type",
    "Date",
  ];

  const rows = entries.map((e) => {
    const split = splitMap[e.id] ?? { commPrakash: "", commOthers: "" };
    return [
      e.name,
      e.mobileNumber,
      formatCurrency(e.amount),
      split.commPrakash || "0.00",
      split.commOthers || "0.00",
      formatCurrency(e.totalAmount),
      e.paid ? "Yes" : "No",
      commissionTypeMap[e.id] ?? "Comm Prakash",
      formatDate(e.dateCreated),
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  // Use UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  // Replace .xlsx extension with .csv for accuracy
  link.download = filename.replace(/\.xlsx$/i, ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
