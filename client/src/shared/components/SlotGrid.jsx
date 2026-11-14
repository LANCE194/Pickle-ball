import { colors, slotColors } from '../theme/tokens';
import { Clock, CheckCircle2, Ban, Info, XCircle } from '../lib/icons';
import { readableTextColor } from '../lib/color';
const LABEL = { available: ['Available', Info], pending: ['Held', Clock], confirmed: ['Booked', CheckCircle2], blocked: ['Blocked', Ban], cancelled: ['Cancelled', XCircle], rejected: ['Rejected', XCircle], past: ['Past', Ban] };
/** Colour-coded slots follow the shared palette and include status text and icons. */
export default function SlotGrid({ courts, selected = [], onToggle, selectable = true }) {
  return <div className="space-y-4">
    <ul className="flex flex-wrap gap-3 text-sm" aria-label="Colour guide">{['available', 'pending', 'confirmed', 'blocked', 'cancelled', 'rejected'].map(k => <li key={k} className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: slotColors[k] }} />{LABEL[k][0]}</li>)}</ul>
    {courts.map(c => <section key={c.court.id} aria-label={`${c.court.name}`}>
      <h3 className="mb-2">{c.court.name} <span className="muted font-normal text-base">(Court {c.court.court_number})</span> <span className="muted font-normal text-sm">{c.dateLabel}</span></h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">{c.slots.map(s => {
        const sel = selected.some(x => x.court === c.court.id && x.start === s.start); const free = s.status === 'available'; const [txt, I] = LABEL[s.status];
        const color = sel ? slotColors.confirmed : slotColors[s.status];
        return <button key={s.start} type="button" disabled={!selectable || !free} aria-pressed={sel} onClick={() => onToggle && onToggle(c.court, s)}
          className="min-h-[56px] rounded-card px-2 py-1 text-left disabled:cursor-not-allowed focus-visible:outline-offset-2" style={{ background: color, color: readableTextColor(color), outline: sel ? `3px solid ${colors.volt}` : undefined }}>
          <span className="block text-sm font-semibold">{s.label.split(' - ')[0]}</span><span className="flex items-center gap-1 text-xs"><I size={13} aria-hidden="true" />{sel ? 'Chosen' : txt}</span></button>;
      })}</div></section>)}
  </div>;
}
