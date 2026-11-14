import Button from './Button';
// Title on the left, ONE main button on the right (sticks to the bottom on phones).
export default function PageHeader({ title, subtitle, action }) {
  return <>
    <div className="flex items-start justify-between gap-3 mb-4"><div className="page-heading"><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div>
      {action && <div className="hidden md:block"><Button variant={action.variant || 'primary'} icon={action.icon} onClick={action.onClick} loading={action.loading} disabled={action.disabled}>{action.label}</Button></div>}</div>
    {action && <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 px-4 pb-2 pointer-events-none"><div className="pointer-events-auto"><Button full variant={action.variant || 'primary'} icon={action.icon} onClick={action.onClick} loading={action.loading} disabled={action.disabled}>{action.label}</Button></div></div>}
  </>;
}
