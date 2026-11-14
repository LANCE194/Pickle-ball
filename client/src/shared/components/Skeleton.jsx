export default function Skeleton({ lines = 3, className = '' }) {
  return <div className={`space-y-3 ${className}`} role="status" aria-label="Loading">{Array.from({ length: lines }).map((_, i) => <div key={i} className="skeleton h-5" style={{ width: `${95 - i * 12}%` }} />)}</div>;
}
export const SkeletonCards = ({ n = 3 }) => <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">{Array.from({ length: n }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>;
