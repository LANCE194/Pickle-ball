import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Bell, CheckCircle2, XCircle, Undo2 } from '../lib/icons';
const Ctx = createContext(null);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, { tone = 'ok', undo, body, onClick, ms } = {}) => { const id = Math.random().toString(36).slice(2); setItems(l => [...l, { id, text, tone, undo, body, onClick }].slice(-5)); setTimeout(() => setItems(l => l.filter(x => x.id !== id)), ms || (undo ? 10000 : 4500)); }, []);
  const close = useCallback(id => setItems(l => l.filter(x => x.id !== id)), []);
  const ok = useCallback((t, o) => push(t, o), [push]);
  const error = useCallback(t => push(t, { tone: 'err' }), [push]);
  const notification = useCallback((n, onClick) => push(n.title, { tone: 'notification', body: n.body, onClick, ms: 10000 }), [push]);
  const value = useMemo(() => ({ ok, error, notification }), [ok, error, notification]);
  return <Ctx.Provider value={value}>{children}
    <div className="fixed z-[70] bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[min(92vw,420px)] space-y-2" aria-live="polite">
      {items.map(i => <div key={i.id} className={`toast-enter flex items-center gap-3 rounded-card px-4 py-3 shadow-card ${i.tone === 'err' ? 'bg-alert text-alert-ink' : 'bg-navy text-white dark:bg-court'}`}>
        {i.onClick ? <button type="button" onClick={() => { i.onClick(); close(i.id); }} className="flex flex-1 items-start gap-3 text-left">
          <Bell size={20} aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block font-semibold">{i.text}</span>{i.body && <span className="block text-sm opacity-90">{i.body}</span>}</span>
        </button> : <>{i.tone === 'err' ? <XCircle size={20} aria-hidden="true" /> : <CheckCircle2 size={20} aria-hidden="true" />}<span className="flex-1">{i.text}</span></>}
        {i.undo && <button type="button" onClick={() => { i.undo(); close(i.id); }} className="min-h-tap min-w-tap inline-flex items-center gap-1 underline font-medium"><Undo2 size={16} aria-hidden="true" />Undo</button>}
      </div>)}
    </div></Ctx.Provider>;
}
export const useToast = () => useContext(Ctx);
