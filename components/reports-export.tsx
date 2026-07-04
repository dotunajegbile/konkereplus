"use client";

// Client-only CSV export. Receives already-computed rows so no data logic lives here.
export function ReportsExport({ filename, rows }: { filename: string; rows: (string | number)[][] }) {
  function download() {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button
      onClick={download}
      className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/5"
    >
      Export CSV
    </button>
  );
}
