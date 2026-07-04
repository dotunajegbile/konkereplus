import Link from "next/link";

export type SetupStep = { label: string; hint: string; href: string; done: boolean };

// First-run setup guide. Shows the property → unit → tenant → lease → invoice chain,
// checking off completed steps and highlighting the next action. Render only while
// the chain is incomplete; it disappears once every step is done.
export function OnboardingChecklist({ steps }: { steps: SetupStep[] }) {
  const done = steps.filter((s) => s.done).length;
  const nextIndex = steps.findIndex((s) => !s.done);

  return (
    <section className="mt-6 rounded-2xl border border-brand/25 bg-brand/[0.04] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">Get set up</h2>
          <p className="mt-0.5 text-sm text-white/50">A few steps to bring your first property online.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums">{done}/{steps.length}</div>
          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {steps.map((s, i) => {
          const isNext = i === nextIndex;
          return (
            <li
              key={s.href}
              className={
                "flex items-center gap-3 rounded-xl border px-4 py-3 " +
                (s.done ? "border-white/10 bg-white/[0.02]" : isNext ? "border-brand/40 bg-brand/[0.06]" : "border-white/10 bg-white/[0.02] opacity-60")
              }
            >
              <span className={"grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold " + (s.done ? "bg-green-500/20 text-green-400" : isNext ? "bg-brand text-white" : "bg-white/10 text-white/50")}>
                {s.done ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className={"text-sm font-semibold " + (s.done ? "text-white/60 line-through" : "")}>{s.label}</div>
                {!s.done && isNext && <div className="text-xs text-white/50">{s.hint}</div>}
              </div>
              {isNext && (
                <Link href={s.href} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">
                  {s.label.startsWith("Add") || s.label.startsWith("Create") ? s.label : "Go"} →
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
