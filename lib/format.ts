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

export const LEASE_STATUS_STYLE: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  draft: "bg-white/10 text-white/60",
  pending_approval: "bg-amber-500/15 text-amber-400",
  pending_signature: "bg-amber-500/15 text-amber-400",
  renewed: "bg-blue-500/15 text-blue-400",
  expired: "bg-white/10 text-white/50",
  terminated: "bg-red-500/15 text-red-400",
};

export const CADENCE_LABEL: Record<string, string> = {
  monthly: "Monthly", quarterly: "Quarterly", biannual: "Biannual", annual: "Annual",
};

export const INVOICE_STATUS_STYLE: Record<string, string> = {
  paid: "bg-green-500/15 text-green-400",
  part_paid: "bg-amber-500/15 text-amber-400",
  open: "bg-white/10 text-white/60",
  overdue: "bg-red-500/15 text-red-400",
  void: "bg-white/10 text-white/40",
};

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const MAINT_STATUS_STYLE: Record<string, string> = {
  open: "bg-white/10 text-white/60",
  assigned: "bg-blue-500/15 text-blue-400",
  in_progress: "bg-amber-500/15 text-amber-400",
  on_hold: "bg-amber-500/15 text-amber-400",
  completed: "bg-green-500/15 text-green-400",
  cancelled: "bg-white/10 text-white/40",
};

export const PRIORITY_STYLE: Record<string, string> = {
  emergency: "bg-red-500/15 text-red-400",
  high: "bg-amber-500/15 text-amber-400",
  medium: "bg-white/10 text-white/60",
  low: "bg-white/10 text-white/50",
};
