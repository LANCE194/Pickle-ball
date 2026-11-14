import Button from './Button';
// Pop-ups only to confirm an action. Says what will happen in plain words.
export default function ConfirmDialog({ open, title, text, confirmLabel = 'Yes, continue', cancelLabel = 'No, go back', danger, loading, onConfirm, onCancel, children }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
    <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
    <div className="surface relative rounded-card shadow-card w-full max-w-md p-5 slide-up"><h2>{title}</h2>{text && <p className="muted mt-2">{text}</p>}{children}
      <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end"><Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button><Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></div>
    </div></div>;
}
