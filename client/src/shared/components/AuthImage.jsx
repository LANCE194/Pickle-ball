import { useEffect, useState } from 'react';
import { api } from '../lib/api';
// Private pictures (payment proof, QR) need this tab's token, so they are fetched and shown from memory.
export default function AuthImage({ path, alt, className = '' }) {
  const [src, setSrc] = useState(null); const [bad, setBad] = useState(false);
  useEffect(() => { let url; let off = false; api.blobUrl(path).then(u => { url = u; if (!off) setSrc(u); }).catch(() => !off && setBad(true)); return () => { off = true; if (url) URL.revokeObjectURL(url); }; }, [path]);
  if (bad) return <div className={`skeleton ${className}`} role="img" aria-label="Picture could not be loaded" />;
  return src ? <img src={src} alt={alt} className={className} /> : <div className={`skeleton ${className}`} aria-hidden="true" />;
}
