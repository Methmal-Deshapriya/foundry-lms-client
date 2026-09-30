// Minimal CSV export for admin tables — opens directly in Excel and Google
// Sheets, with no spreadsheet library to ship or keep patched.

// A cell starting with one of these is treated as a formula by Excel/Sheets.
// Student-supplied text (names, addresses) must never execute on an admin's
// machine, so such cells are prefixed with an apostrophe (shown as text).
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

function escapeCell(value: string | number | null | undefined) {
  let text = value == null ? "" : String(value);
  if (FORMULA_TRIGGERS.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

/** Triggers a browser download. The UTF-8 BOM makes Excel read non-ASCII names (e.g. Sinhala, Tamil) correctly. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
