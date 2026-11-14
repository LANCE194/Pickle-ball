import { useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';

export default function BackupsPage() {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);

  async function exportBackup() {
    setExporting(true);
    try {
      const backup = await api.post('/api/admin/backups/export');
      await api.download(`/api/admin/backups/${encodeURIComponent(backup.name)}`, backup.name);
      toast.ok('Your club backup was exported.');
    } catch (error) { toast.error(error.message); }
    finally { setExporting(false); }
  }

  async function sendBackup() {
    setSending(true);
    try {
      await api.post('/api/admin/backups/send');
      toast.ok('A club backup was sent to the Super Admin in Messages.');
    } catch (error) { toast.error(error.message); }
    finally { setSending(false); }
  }

  return <>
    <PageHeader title="Backups" subtitle="Export your club data or send a recoverable club backup directly to the Super Admin." />
    <Card className="max-w-2xl space-y-4">
      <div>
        <h2 className="font-semibold">Club backup</h2>
        <p className="muted mt-1">This backup contains only your club's records and referenced images. It does not include login sessions or OTP codes. The Super Admin can merge it back into this same club.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" loading={exporting} onClick={exportBackup}>Export and download</Button>
        <Button loading={sending} onClick={sendBackup}>Send backup to Super Admin</Button>
      </div>
    </Card>
  </>;
}
