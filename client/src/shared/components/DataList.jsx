import { useState } from 'react';
import { Search } from '../lib/icons';
import FormField from './FormField';
import EmptyState from './EmptyState';
import Skeleton, { SkeletonCards } from './Skeleton';
import ErrorPanel from './ErrorPanel';
// Filters row (search, filters, removable chips) above a list of cards. Lists become cards on phones instead of wide tables.
export default function DataList({ items, loading, error, onRetry, renderItem, search, onSearch, filters = [], values = {}, onFilter, empty, columns = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  const chips = filters.filter(f => values[f.name]).map(f => ({ f, label: (f.options.find(o => (o.value ?? o) === values[f.name]) || {}).label || values[f.name] }));
  return <div className="space-y-4">
    {(onSearch || filters.length > 0) && <div className="flex flex-col sm:flex-row gap-3">
      {onSearch && <div className="flex-1 relative"><Search size={18} className="absolute left-3 top-3.5 muted" aria-hidden="true" /><input aria-label={search?.label || 'Search'} value={search?.value || ''} onChange={e => onSearch(e.target.value)} placeholder={search?.placeholder || 'Search'} className="w-full min-h-tap rounded-card border line surface pl-10 pr-3" /></div>}
      {filters.map(f => <FormField key={f.name} label="" aria-label={f.label} options={f.options} placeholder={f.label} value={values[f.name] || ''} onChange={e => onFilter(f.name, e.target.value)} className="sm:w-48" />)}
    </div>}
    {chips.length > 0 && <div className="flex flex-wrap gap-2">{chips.map(({ f, label }) => <button key={f.name} type="button" onClick={() => onFilter(f.name, '')} className="min-h-tap inline-flex items-center gap-2 rounded-full border line px-3 surface">{f.label}: {label}<span aria-hidden="true">x</span><span className="sr-only">Remove filter</span></button>)}</div>}
    {error ? <ErrorPanel error={error} onRetry={onRetry} /> : loading ? <SkeletonCards /> : !items?.length ? (empty ? <EmptyState {...empty} /> : <EmptyState title="Nothing here yet" />) : <div className={`grid gap-3 ${columns}`}>{items.map((it, i) => <div key={it.id || i} className="fade-in">{renderItem(it)}</div>)}</div>}
  </div>;
}
export { Skeleton };
