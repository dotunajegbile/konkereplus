import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import { DocumentUploader } from "@/components/document-uploader";
import { deleteDocument } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";

function fileSize(b: number | null | undefined) {
  if (!b) return "—";
  if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB";
  if (b >= 1e3) return Math.round(b / 1e3) + " KB";
  return b + " B";
}

export default async function DocumentsPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: m } = await supabase.from("memberships").select("tenant_id").eq("user_id", user.id).maybeSingle();
  if (!m) redirect("/onboarding");

  const [{ data: docs }, { data: properties }] = await Promise.all([
    supabase.from("documents").select("id, name, category, storage_path, mime_type, size_bytes, expires_at, created_at, properties(name)").order("created_at", { ascending: false }),
    supabase.from("properties").select("id, name").order("name"),
  ]);

  // Short-lived signed URLs for download.
  const signed = new Map<string, string>();
  await Promise.all((docs ?? []).map(async (d) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(d.storage_path, 3600);
    if (data?.signedUrl) signed.set(d.id, data.signedUrl);
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-white/50">{docs?.length ?? 0} files · stored privately, tenant-isolated</p>
      </div>

      {searchParams.error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{searchParams.error}</p>}

      <DocumentUploader tenantId={m.tenant_id} properties={properties ?? []} />

      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        {(docs?.length ?? 0) === 0 ? (
          <div className="py-12 text-center text-sm text-white/50">No documents yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Property</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {docs!.map((d) => (
                <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    {signed.get(d.id)
                      ? <a href={signed.get(d.id)} target="_blank" className="font-semibold hover:text-brand">{d.name}</a>
                      : <span className="font-semibold">{d.name}</span>}
                    <div className="text-xs text-white/40">{fmtDate(d.created_at)}</div>
                  </td>
                  <td className="px-4 py-3 text-white/70">{d.category ?? "—"}</td>
                  <td className="px-4 py-3 text-white/60">{(d.properties as { name?: string } | null)?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-white/60">{fileSize(d.size_bytes)}</td>
                  <td className="px-4 py-3 text-white/60">{d.expires_at ? fmtDate(d.expires_at) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {signed.get(d.id) && <a href={signed.get(d.id)} target="_blank" className="rounded-lg border border-white/15 px-2.5 py-1 text-xs hover:bg-white/5">Download</a>}
                      <form action={deleteDocument}>
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="storage_path" value={d.storage_path} />
                        <ConfirmButton message="Delete this document?" className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10">✕</ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
