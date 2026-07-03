// Money is stored as integer minor units (kobo). Display in whole Naira.
export function ngn(minor: number | null | undefined): string {
  const n = Math.round((minor ?? 0) / 100);
  return "₦" + n.toLocaleString("en-NG");
}

// Parse a user-entered Naira amount (e.g. "150,000") into minor units.
export function toMinor(input: string): number {
  const naira = Number(String(input).replace(/[^0-9.]/g, ""));
  return Number.isFinite(naira) ? Math.round(naira * 100) : 0;
}

export const UNIT_STATUS_STYLE: Record<string, string> = {
  available: "bg-green-500/15 text-green-400",
  occupied: "bg-brand/15 text-brand",
  reserved: "bg-blue-500/15 text-blue-400",
  notice: "bg-amber-500/15 text-amber-400",
  maintenance: "bg-amber-500/15 text-amber-400",
  vacant: "bg-white/10 text-white/50",
};
