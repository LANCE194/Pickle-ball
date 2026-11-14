import { useId, useState } from 'react';
import { Upload } from '../lib/icons';
// JPG/PNG up to 5 MB, previewed before saving. The server re-checks the real file type.
export default function FileUpload({ label, helper, error, onChange, accept = 'image/jpeg,image/png', maxMb = 5 }) {
  const id = useId(); const [preview, setPreview] = useState(null); const [err, setErr] = useState(null);
  const pick = e => { const f = e.target.files?.[0]; if (!f) return; if (!['image/jpeg', 'image/png'].includes(f.type)) { setErr('Please choose a JPG or PNG picture.'); return; } if (f.size > maxMb * 1024 * 1024) { setErr(`That picture is too big. Use one under ${maxMb} MB.`); return; } setErr(null); setPreview(URL.createObjectURL(f)); onChange(f); };
  return <div><label htmlFor={id} className="block font-medium mb-1">{label}</label>
    <label htmlFor={id} className={`flex flex-col items-center justify-center gap-2 min-h-[120px] rounded-card border-2 border-dashed cursor-pointer surface ${error || err ? 'border-alert' : 'line'}`}>
      {preview ? <img src={preview} alt="Preview of the chosen picture" className="max-h-48 rounded-card" /> : <><Upload aria-hidden="true" /><span>Tap to choose a picture</span></>}
    </label><input id={id} type="file" accept={accept} onChange={pick} className="sr-only" />
    {(helper && !error && !err) && <p className="text-sm muted mt-1">{helper}</p>}{(error || err) && <p role="alert" className="text-alert text-sm mt-1">{error || err}</p>}</div>;
}
