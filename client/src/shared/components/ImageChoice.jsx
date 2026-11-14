// A picture you can tap to choose (media library, gallery). Min 44 px tap target.
export default function ImageChoice({ src, selected, onClick, label = 'Choose this picture' }) {
  return <button type="button" onClick={onClick} aria-pressed={!!selected} aria-label={label} className={`min-h-tap min-w-tap rounded-card overflow-hidden border-2 ${selected ? 'border-court' : 'line'}`}><img src={src} alt="" className="h-14 w-14 object-cover" /></button>;
}
