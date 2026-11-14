import { useId, useState } from 'react';
import { Eye, EyeOff } from '../lib/icons';
import { phMobile } from '../lib/format';
// Label above, helper text below, plain-words error, 44 px height, the right keyboard for phone / email / date.
export default function FormField({ label, helper, error, type = 'text', options, value, onChange, name, placeholder, required, textarea, rows = 3, className = '', ...p }) {
  const id = useId(); const [show, setShow] = useState(false);
  const base = `w-full min-h-tap rounded-card border px-3 py-2 surface ${error ? 'border-alert' : 'line'} focus:border-court`;
  const set = v => onChange && onChange(name ? { target: { name, value: v } } : { target: { value: v } });
  let input;
  if (options) input = <select id={id} name={name} value={value ?? ''} onChange={e => set(e.target.value)} className={base} aria-invalid={!!error} {...p}>{placeholder && <option value="">{placeholder}</option>}{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>;
  else if (textarea) input = <textarea id={id} name={name} rows={rows} value={value ?? ''} onChange={e => set(e.target.value)} placeholder={placeholder} className={base} aria-invalid={!!error} {...p} />;
  else if (type === 'checkbox') return <div className={className}><label className="flex items-start gap-3 min-h-tap cursor-pointer"><input id={id} type="checkbox" checked={!!value} onChange={e => set(e.target.checked)} className="mt-1 h-5 w-5 accent-court" {...p} /><span>{label}{helper && <span className="block text-sm muted">{helper}</span>}</span></label>{error && <p role="alert" className="text-alert text-sm mt-1">{error}</p>}</div>;
  else if (type === 'password') input = <div className="relative"><input id={id} name={name} type={show ? 'text' : 'password'} value={value ?? ''} onChange={e => set(e.target.value)} placeholder={placeholder} autoComplete={p.autoComplete || 'current-password'} className={base + ' pr-12'} aria-invalid={!!error} {...p} /><button type="button" onClick={() => setShow(s => !s)} className="absolute right-0 top-0 min-h-tap min-w-tap inline-flex items-center justify-center" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button></div>;
  else if (type === 'tel') input = <input id={id} name={name} type="tel" inputMode="tel" value={value ?? ''} onChange={e => set(phMobile(e.target.value))} placeholder={placeholder || '0917 123 4567'} autoComplete="tel" className={base} aria-invalid={!!error} {...p} />;
  else input = <input id={id} name={name} type={type} inputMode={type === 'number' ? 'decimal' : type === 'email' ? 'email' : undefined} value={value ?? ''} onChange={e => set(e.target.value)} placeholder={placeholder} className={base} aria-invalid={!!error} {...p} />;
  return <div className={className}><label htmlFor={id} className="block font-medium mb-1">{label}{required && <span className="text-alert" aria-hidden="true"> *</span>}</label>{input}{helper && !error && <p className="text-sm muted mt-1">{helper}</p>}{error && <p role="alert" className="text-alert text-sm mt-1">{error}</p>}</div>;
}
