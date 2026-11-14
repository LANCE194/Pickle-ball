// Progress bar for the 3-step flows.
export default function Stepper({ steps, current }) {
  return <nav aria-label="Progress" className="mb-4"><div className="flex gap-2">{steps.map((s, i) => <div key={s} className="flex-1"><div className={`h-2 rounded-full ${i <= current ? 'bg-court dark:bg-volt' : 'bg-slate-dn/30'}`} /><p className={`text-sm mt-1 ${i === current ? 'font-semibold' : 'muted'}`} aria-current={i === current ? 'step' : undefined}>{i + 1}. {s}</p></div>)}</div></nav>;
}
