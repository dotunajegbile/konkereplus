"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveDocument } from "@/app/(workspace)/documents/actions";

export function DocumentUploader({
  tenantId, properties,
}: {
  tenantId: string;
  properties: { id: string; name: string }[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Choose a file"); return; }

    setBusy(true);
    const supabase = createClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${tenantId}/${crypto.randomUUID()}_${safe}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    if (upErr) { setError(upErr.message); setBusy(false); return; }

    const fd = new FormData(form);
    fd.set("name", file.name);
    fd.set("storage_path", path);
    fd.set("mime_type", file.type);
    fd.set("size_bytes", String(file.size));
    await saveDocument(fd); // inserts metadata + redirects to /documents
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-semibold">Upload a document</h2>
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      <input ref={fileRef} type="file" className="text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-600" />
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-white/70">Category</span>
          <input name="category" placeholder="Lease · Certificate · Insurance" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" /></label>
        <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-white/70">Property (optional)</span>
          <select name="property_id" defaultValue="" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="" className="bg-ink">—</option>
            {properties.map((p) => <option key={p.id} value={p.id} className="bg-ink">{p.name}</option>)}
          </select></label>
        <label className="flex flex-col gap-1.5"><span className="text-xs font-semibold text-white/70">Expires (optional)</span>
          <input name="expires_at" type="date" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand" /></label>
      </div>
      <button disabled={busy} className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
        {busy ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
