import { useEffect, useRef } from 'react';
import { X } from '../lib/icons';
// Editing opens in a side drawer (bottom sheet on phones) so the person keeps their place.
export default function Drawer({ open, title, onClose, children, footer }) {
  const ref = useRef(null); const onCloseRef = useRef(onClose); onCloseRef.current = onClose;
  useEffect(() => { if (!open) return undefined; const k = e => e.key === 'Escape' && onCloseRef.current(); document.addEventListener('keydown', k); ref.current?.focus(); return () => document.removeEventListener('keydown', k); }, [open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />
    <div ref={ref} tabIndex={-1} className="surface absolute bottom-0 left-0 right-0 max-h-[92vh] rounded-t-2xl md:rounded-none md:top-0 md:left-auto md:w-[480px] md:max-h-none md:rounded-l-2xl flex flex-col drawer-enter outline-none">
      <div className="flex items-center justify-between px-4 py-3 border-b line"><h2>{title}</h2><button type="button" onClick={onClose} className="min-h-tap min-w-tap inline-flex items-center justify-center rounded-card hover:bg-black/5 dark:hover:bg-white/10" aria-label="Close"><X aria-hidden="true" /></button></div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
      {footer && <div className="border-t line p-4 flex gap-2 justify-end pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
    </div></div>;
}
