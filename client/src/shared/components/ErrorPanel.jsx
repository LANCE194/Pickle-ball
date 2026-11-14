import Button from './Button';
import { AlertTriangle } from '../lib/icons';
// Friendly errors with a Try again button. Never a raw code.
export default function ErrorPanel({ error, onRetry }) {
  const msg = error?.status >= 500 || !error?.message ? 'Something went wrong on our side. Please try again.' : error.message;
  return <div role="alert" className="rounded-card border border-alert/40 bg-alert/10 p-4 flex gap-3 items-start"><AlertTriangle className="text-alert shrink-0" aria-hidden="true" /><div className="flex-1"><p className="font-medium">{msg}</p>{onRetry && <div className="mt-3"><Button variant="secondary" onClick={onRetry}>Try again</Button></div>}</div></div>;
}
