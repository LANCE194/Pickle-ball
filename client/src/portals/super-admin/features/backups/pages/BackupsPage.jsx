import { useRef, useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import DataList from '../../../../../shared/components/DataList';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
export default function BackupsPage() {
  const toast = useToast(); const { data, loading, error, reload } = useApi('/api/super-admin/backups'); const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false); const fileRef = useRef(null);
  const make = async () => { setBusy(true); try { await api.post('/api/super-admin/backups'); toast.ok('Backup created.'); reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  const restore = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error('Choose a DinkNest full backup first.');
    if (!window.confirm('Restore this full-system backup? The current database will be replaced. A safety backup will be created first, and users may need to sign in again.')) return;
    setRestoring(true);
    try {
      const form = new FormData(); form.append('file', file);
      const result = await api.upload('/api/super-admin/backups/import', form);
      toast.ok(`System restored. Safety backup: ${result.safetyBackup}. Users may need to sign in again.`);
      if (fileRef.current) fileRef.current.value = '';
      reload();
    } catch (e) { toast.error(e.message); }
    finally { setRestoring(false); }
  };
  return <><PageHeader title="Backups" subtitle="Full-system backups include the database and private uploaded files. Admins can send club-only backups to you through Messages." action={{ label: 'Create a full backup now', onClick: make, loading: busy }} />
    <Card className="mb-4 space-y-3">
      <div><h2 className="font-semibold">Restore a full system</h2><p className="muted mt-1">Imports replace the current database after validation and create a safety backup first. Existing storage files are preserved; files included in the backup are restored. Older database-only .db backups are also accepted, but cannot restore uploaded files that were not in that backup.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept=".db,.gz,.dnbackup.gz,application/gzip,application/x-sqlite3" aria-label="Choose a full system backup" />
        <Button variant="secondary" loading={restoring} onClick={restore}>Validate and restore</Button>
      </div>
    </Card>
    <DataList items={data} loading={loading} error={error} onRetry={reload} empty={{ title: 'No backups yet', text: 'Create one now. You can also copy the data folder while the server is stopped.', actionLabel: 'Create a backup now', onAction: make }}
      renderItem={b => <Card className="space-y-1"><p className="font-semibold break-all">{b.name}</p><p className="muted">{(b.bytes / 1024).toFixed(0)} KB, {new Date(b.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p><Button variant="secondary" onClick={() => api.download(`/api/super-admin/backups/${encodeURIComponent(b.name)}`, b.name).catch(e => toast.error(e.message))}>Download</Button></Card>} /></>;
}
