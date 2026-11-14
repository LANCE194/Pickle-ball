import { useEffect, useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import Button from '../../../../../shared/components/Button';
import Card from '../../../../../shared/components/Card';
import ConfirmDialog from '../../../../../shared/components/ConfirmDialog';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import { useToast } from '../../../../../shared/components/Toast';

const BASE = '/api/super-admin/domains';

export default function DomainsPage() {
  const toast = useToast();
  const [clubs, setClubs] = useState([]);
  const [domains, setDomains] = useState([]);
  const [clubId, setClubId] = useState('');
  const [host, setHost] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.get(BASE);
      setClubs(result.clubs);
      setDomains(result.domains);
      setClubId(current => current || result.clubs[0]?.id || '');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createDomain = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(BASE, { clubId, host });
      setHost('');
      toast.ok('Domain added. Publish its DNS TXT challenge to verify ownership.');
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const copyText = async value => {
    try {
      await navigator.clipboard.writeText(value);
      toast.ok('Copied to clipboard.');
    } catch (error) {
      toast.error(`Could not copy: ${error.message}`);
    }
  };

  const runAction = async () => {
    const current = action;
    if (!current) return;
    setSaving(true);
    try {
      const path = `${BASE}/${current.domain.id}`;
      if (current.type === 'verify') {
        await api.post(`${path}/verify-dns`);
        toast.ok('DNS ownership verified.');
      } else if (current.type === 'https') {
        await api.post(`${path}/https-ready`, { confirmed: true });
        toast.ok('HTTPS readiness recorded.');
      } else if (current.type === 'rotate') {
        await api.post(`${path}/rotate-challenge`);
        toast.ok('A new DNS challenge was generated.');
      } else if (current.type === 'enable') {
        await api.post(`${path}/enable`);
        toast.ok('Domain re-enabled. Publish its new TXT challenge to verify ownership.');
      } else {
        await api.post(`${path}/disable`);
        toast.ok('Domain disabled.');
      }
      setAction(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const actionText = action?.type === 'https'
    ? 'Confirm that the ingress has a valid certificate for this domain and redirects or blocks plain HTTP. The app will not test the certificate for you.'
    : action?.type === 'disable'
      ? 'This domain will stop resolving to its club. Its ownership record will be kept for audit history.'
      : action?.type === 'rotate'
        ? 'The current challenge will be invalidated. Publish the new TXT record before verifying again.'
        : action?.type === 'enable'
          ? 'The domain will return to pending status with a new TXT challenge. It will not serve content until DNS and HTTPS are confirmed again.'
        : 'The server will look up the published DNS TXT record now.';

  return <div className="space-y-4">
    <header>
      <h1>Club domains</h1>
      <p className="muted mt-1">Verify DNS ownership and record HTTPS readiness before a custom domain can serve club content.</p>
    </header>

    <Card>
      <h2>Add a domain</h2>
      {clubs.length === 0
        ? <p className="muted mt-2">There are no clubs available yet.</p>
        : <form className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end" onSubmit={createDomain}>
          <label className="block">
            <span className="text-sm font-medium">Club</span>
            <select className="mt-1 w-full min-h-tap rounded-card border line bg-transparent px-3" value={clubId} onChange={event => setClubId(event.target.value)} required>
              {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Domain name</span>
            <input className="mt-1 w-full min-h-tap rounded-card border line bg-transparent px-3" value={host} onChange={event => setHost(event.target.value)} placeholder="play.example.com" autoCapitalize="none" autoCorrect="off" required />
          </label>
          <Button type="submit" loading={saving}>Add domain</Button>
        </form>}
    </Card>

    <Card>
      <h2>Generated club websites</h2>
      <p className="muted mt-1">Links are shown only after the subdomain base, wildcard HTTPS, and multi-club access are enabled.</p>
      <ul className="mt-3 space-y-2">
        {clubs.map(club => <li key={club.id} className="flex flex-wrap items-center justify-between gap-2 border-b line pb-2 last:border-0">
          <span>{club.name} <span className="muted">({club.status})</span></span>
          {club.website_url
            ? <a href={club.website_url} target="_blank" rel="noopener noreferrer">{club.website_url}</a>
            : <span className="muted text-sm">Not available yet</span>}
        </li>)}
      </ul>
    </Card>

    {loading ? <Card><p className="muted">Loading domains…</p></Card>
      : domains.length === 0 ? <Card><p className="muted">No domains have been added.</p></Card>
        : <div className="space-y-3">{domains.map(domain => <Card key={domain.id} className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2>{domain.host}</h2>
              <p className="muted">{domain.club_name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={domain.verification_status} />
              <StatusBadge status={domain.https_ready ? 'active' : 'pending'} label={domain.https_ready ? 'HTTPS confirmed' : 'HTTPS not confirmed'} />
            </div>
          </div>
          {domain.verification_status !== 'disabled' && <div className="rounded-card border line p-3 space-y-2">
            <p className="text-sm font-medium">DNS TXT challenge</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <code className="break-all">{domain.txt_name}</code>
              <Button variant="secondary" onClick={() => copyText(domain.txt_name)}>Copy name</Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <code className="break-all">{domain.txt_value}</code>
              <Button variant="secondary" onClick={() => copyText(domain.txt_value)}>Copy value</Button>
            </div>
            <p className="muted text-sm">Publish this TXT record, allow DNS to update, then choose Verify DNS.</p>
          </div>}
          <div className="flex flex-wrap gap-2">
            {domain.verification_status === 'disabled' &&
              <Button variant="secondary" onClick={() => setAction({ type: 'enable', domain })}>Enable domain</Button>}
            {domain.verification_status !== 'verified' && domain.verification_status !== 'disabled' &&
              <Button variant="secondary" onClick={() => setAction({ type: 'verify', domain })}>Verify DNS</Button>}
            {domain.verification_status === 'verified' && !domain.https_ready &&
              <Button variant="secondary" onClick={() => setAction({ type: 'https', domain })}>Confirm HTTPS ready</Button>}
            {domain.verification_status !== 'disabled' &&
              <Button variant="ghost" onClick={() => setAction({ type: 'rotate', domain })}>Rotate challenge</Button>}
            {domain.verification_status !== 'disabled' &&
              <Button variant="danger" onClick={() => setAction({ type: 'disable', domain })}>Disable domain</Button>}
          </div>
        </Card>)}</div>}

    <ConfirmDialog open={!!action} title={action?.type === 'https' ? 'Confirm HTTPS readiness?' : action?.type === 'disable' ? 'Disable this domain?' : action?.type === 'rotate' ? 'Rotate DNS challenge?' : action?.type === 'enable' ? 'Enable this domain?' : 'Verify DNS ownership?'} text={actionText} confirmLabel={action?.type === 'https' ? 'Yes, HTTPS is ready' : action?.type === 'disable' ? 'Disable domain' : action?.type === 'rotate' ? 'Generate new challenge' : action?.type === 'enable' ? 'Enable domain' : 'Check DNS'} danger={action?.type === 'disable'} loading={saving} onCancel={() => setAction(null)} onConfirm={runAction} />
  </div>;
}
