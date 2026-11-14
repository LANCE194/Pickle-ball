import { useState } from 'react';
import { Plus, Pencil } from '../lib/icons';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';
import { useToast } from './Toast';
import PageHeader from './PageHeader';
import DataList from './DataList';
import Drawer from './Drawer';
import Button from './Button';
import Card from './Card';
import FormField from './FormField';
import ConfirmDialog from './ConfirmDialog';
import FileUpload from './FileUpload';
/**
 * List + search + filters + edit drawer + confirm dialog in one component. Used by most owner / front desk screens so
 * they all look and behave the same (CONSISTENCY RULE). Feature folders pass configuration, never their own styles.
 */
export default function CrudPage({ title, subtitle, listPath, params, pick = d => d, search, filters = [], card, fields = [], createLabel, onCreate, onUpdate, initial = {}, toForm = x => x, archive, extraActions, empty, events, headerAction, columns, canEdit = true }) {
  const toast = useToast(); const [q, setQ] = useState(''); const [fv, setFv] = useState({}); const [drawer, setDrawer] = useState(null); const [form, setForm] = useState({}); const [errs, setErrs] = useState({}); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(null);
  const { data, loading, error, reload } = useApi(listPath, { ...(params || {}), q, ...fv }, { events });
  const items = data ? pick(data) : [];
  const open = item => { setForm(item ? toForm(item) : { ...initial }); setErrs({}); setDrawer(item || {}); };
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const save = async () => {
    setBusy(true); setErrs({});
    try { const r = drawer.id ? await onUpdate(drawer, form) : await onCreate(form); toast.ok(r?.message || 'Saved.'); setDrawer(null); reload(); }
    catch (e) { setErrs(e.fields || {}); if (!e.fields) toast.error(e.message); } finally { setBusy(false); }
  };
  const runArchive = async () => { setBusy(true); try { const r = await archive.run(confirm); toast.ok(r?.message || 'Done.', { undo: archive.undo ? async () => { await archive.undo(confirm); reload(); } : undefined }); setConfirm(null); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  return <>
    <PageHeader title={title} subtitle={subtitle} action={headerAction || (onCreate ? { label: createLabel, icon: Plus, onClick: () => open(null) } : undefined)} />
    <DataList items={items} loading={loading} error={error} onRetry={reload} search={{ placeholder: search }} onSearch={search ? setQ : undefined} filters={filters} values={fv} onFilter={(k, v) => setFv(s => ({ ...s, [k]: v }))} columns={columns}
      empty={{ ...(empty || { title: 'Nothing here yet' }), actionLabel: onCreate ? createLabel : undefined, onAction: () => open(null) }}
      renderItem={it => <Card className="h-full flex flex-col gap-3"><div className="flex-1">{card(it)}</div>
        <div className="flex flex-wrap gap-2">{onUpdate && canEdit && <Button variant="secondary" icon={Pencil} onClick={() => open(it)}>Edit</Button>}
          {(extraActions ? extraActions(it, reload) : []).filter(Boolean).map(a => <Button key={a.label} variant={a.variant || 'ghost'} onClick={a.onClick}>{a.label}</Button>)}
          {archive && (!archive.when || archive.when(it)) && <Button variant="ghost" onClick={() => setConfirm(it)}>{archive.label}</Button>}</div></Card>} />
    <Drawer open={!!drawer} onClose={() => setDrawer(null)} title={drawer?.id ? 'Edit' : createLabel}
      footer={<><Button variant="secondary" onClick={() => setDrawer(null)}>Cancel</Button><Button loading={busy} onClick={save}>{drawer?.id ? 'Save changes' : createLabel}</Button></>}>
      <div className="space-y-4">{fields.filter(f => !f.showWhen || f.showWhen(form)).map(f => f.type === 'file' ? <FileUpload key={f.name} label={f.label} helper={f.helper} error={errs[f.name]} onChange={file => setForm(x => ({ ...x, [f.name]: file }))} /> : <FormField key={f.name} {...f} value={form[f.name]} onChange={set} error={errs[f.name]} />)}</div>
    </Drawer>
    {archive && <ConfirmDialog open={!!confirm} danger title={archive.title || 'Are you sure?'} text={archive.text} confirmLabel={archive.label} loading={busy} onCancel={() => setConfirm(null)} onConfirm={runArchive} />}
  </>;
}
