import Button from './Button';
// Every empty list explains what goes here and offers ONE button to start.
export default function EmptyState({ title, text, actionLabel, onAction, icon: I }) {
  return <div className="text-center py-10 px-4 surface rounded-card border line">{I && <I className="mx-auto mb-3 text-court dark:text-volt" size={32} aria-hidden="true" />}<h3>{title}</h3>{text && <p className="muted mt-1 max-w-md mx-auto">{text}</p>}{actionLabel && <div className="mt-4"><Button onClick={onAction}>{actionLabel}</Button></div>}</div>;
}
