import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye } from '../../../../../shared/lib/icons';
import { api, apiUrl } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useToast } from '../../../../../shared/components/Toast';
import PageHeader from '../../../../../shared/components/PageHeader';
import Card from '../../../../../shared/components/Card';
import Button from '../../../../../shared/components/Button';
import Drawer from '../../../../../shared/components/Drawer';
import FormField from '../../../../../shared/components/FormField';
import FileUpload from '../../../../../shared/components/FileUpload';
import Skeleton from '../../../../../shared/components/Skeleton';
import ErrorPanel from '../../../../../shared/components/ErrorPanel';
import EmptyState from '../../../../../shared/components/EmptyState';
import StatusBadge from '../../../../../shared/components/StatusBadge';
import ConfirmDialog from '../../../../../shared/components/ConfirmDialog';
import ImageChoice from '../../../../../shared/components/ImageChoice';
import SitePreview from '../../../../../shared/components/SitePreview';
import { useSession } from '../../../../../shared/hooks/useSession';
const KIND = { hero: 'Top banner', courts_rates: 'Courts and rates', events: 'Events', gallery: 'Gallery', about_contact: 'About and contact', testimonials: 'Player quotes', footer: 'Footer' };
const TEMPLATES = [['classic', 'Classic', 'Clean and balanced'], ['sporty', 'Sporty', 'Bold and centered'], ['minimal', 'Minimal', 'Light and simple']];
/** Shared club-site designer: Admins submit drafts; Super Admins preview and publish audited versions. */
export default function SiteDesignerPage() {
  const { user } = useSession(); const isSuperAdmin = user?.role === 'super_admin';
  const toast = useToast();
  const location = useLocation(); const navigate = useNavigate();
  const base = isSuperAdmin ? '/api/super-admin/site-designer' : '/api/admin/site-designer';
  const clubs = useApi('/api/super-admin/site-designer/clubs', null, { enabled: isSuperAdmin });
  const reviewQueue = useApi('/api/super-admin/deployments/queue', null, { enabled: isSuperAdmin, events: ['notification.new'] });
  const [clubId, setClubId] = useState('');
  const ready = !isSuperAdmin || !!clubId;
  const resource = path => `${base}${path}${isSuperAdmin && clubId ? `?club_id=${encodeURIComponent(clubId)}` : ''}`;
  const draftPath = resource('/draft');
  const draft = useApi(draftPath, null, { enabled: ready });
  const opts = useApi(resource('/options'), null, { enabled: ready });
  const media = useApi(resource('/media'), null, { enabled: ready });
  const hist = useApi(resource('/history'), null, { enabled: ready });
  const previewData = useApi(isSuperAdmin && clubId
    ? `${base}/clubs/${encodeURIComponent(clubId)}/preview-data`
    : '/api/guest/courts-rates', null, { enabled: ready });
  const [cfg, setCfg] = useState(null); const [status, setStatus] = useState('draft'); const [sel, setSel] = useState('hero'); const [tab, setTab] = useState('section'); const [width, setWidth] = useState('desktop'); const [dark, setDark] = useState(false); const [saved, setSaved] = useState(''); const [err, setErr] = useState(''); const [sub, setSub] = useState(false); const [note, setNote] = useState(''); const [discard, setDiscard] = useState(false); const [hs, setHs] = useState(false); const [link, setLink] = useState(null); const [mobilePane, setMobilePane] = useState('preview');
  const [publishDialog, setPublishDialog] = useState(false);
  const [reviewPreview, setReviewPreview] = useState(null);
  const timer = useRef(null);
  const selectedClub = (clubs.data || []).find(club => club.id === clubId);
  const publishBlocked = isSuperAdmin && !!draft.data?.publish_blocked;
  const pendingReviews = isSuperAdmin ? (reviewQueue.data || []).filter(version => version.status === 'submitted') : [];
  const deploymentsPath = location.pathname.replace(/\/site-designer\/?$/, '/deployments');
  const siteCourts = isSuperAdmin ? previewData.data?.courts || [] : previewData.data || [];
  const siteEvents = isSuperAdmin ? previewData.data?.events || [] : [];
  const mediaUrl = path => apiUrl(`/api/files/${path}${isSuperAdmin ? `?club_id=${encodeURIComponent(clubId)}` : ''}`);
  useEffect(() => {
    if (isSuperAdmin && clubs.data?.length && !clubs.data.some(club => club.id === clubId)) setClubId(clubs.data[0].id);
  }, [isSuperAdmin, clubs.data, clubId]);
  useEffect(() => {
    clearTimeout(timer.current);
    setCfg(null); setStatus('draft'); setSaved(''); setErr('');
  }, [clubId]);
  useEffect(() => { if (!draft.loading && draft.data) { setCfg(draft.data.config); setStatus(draft.data.status); } }, [draft.data, draft.loading]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const locked = !isSuperAdmin && status === 'submitted';
  const dirty = useCallback(next => { setCfg(next); if (locked) return; setSaved('Saving...'); clearTimeout(timer.current); timer.current = setTimeout(async () => { try { await api.put(draftPath, { config: next }); setSaved('Saved'); setErr(''); } catch (e) { setSaved(''); setErr(e.message); } }, 1200); }, [draftPath, locked]);
  if (isSuperAdmin && clubs.loading) return <Skeleton lines={8} />;
  if (isSuperAdmin && clubs.error) return <ErrorPanel error={clubs.error} onRetry={clubs.reload} />;
  if (isSuperAdmin && clubs.data && !clubs.data.length) return <EmptyState title="No clubs to design" text="Create a club first, then its public site can be designed here." />;
  if (isSuperAdmin && !clubId) return <Skeleton lines={8} />;
  if (draft.error) return <ErrorPanel error={draft.error} onRetry={draft.reload} />;
  if (draft.loading || !cfg) return <Skeleton lines={8} />;
  const set = (path, v) => { const n = JSON.parse(JSON.stringify(cfg)); let o = n; path.slice(0, -1).forEach(k => { o = o[k]; }); o[path[path.length - 1]] = v; dirty(n); };
  const idx = cfg.sections.findIndex(s => s.id === sel); const s = cfg.sections[idx] || cfg.sections[0]; const sp = i => ['sections', i, 'content'];
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= cfg.sections.length) return; const n = { ...cfg, sections: [...cfg.sections] }; [n.sections[i], n.sections[j]] = [n.sections[j], n.sections[i]]; dirty(n); };
  const imgs = (media.data || []);
  const saveNow = async () => {
    clearTimeout(timer.current);
    await api.put(draftPath, { config: cfg });
    setSaved('Saved'); setErr('');
  };
  const upload = async f => { const fd = new FormData(); fd.append('file', f); try { await api.upload(resource('/media'), fd); toast.ok('Picture added.'); media.reload(); } catch (e) { toast.error(e.message); } };
  const pickImg = (label, value, onPick) => <div><p className="font-medium mb-1">{label}</p><div className="flex flex-wrap gap-2">{value && <Button variant="ghost" onClick={() => onPick(null)}>No picture</Button>}{imgs.map(m => <ImageChoice key={m.id} src={mediaUrl(m.path)} selected={value === m.path} onClick={() => onPick(m.path)} />)}</div>{!imgs.length && <p className="text-sm muted">Add a picture in the Pictures tab first.</p>}</div>;
  const submit = async () => { try { await saveNow(); await api.post(resource('/submit'), { note }); toast.ok('Sent to the Super Admin for review.'); setSub(false); draft.reload(); hist.reload(); } catch (e) { toast.error(e.message); } };
  const preview = async () => { try { await saveNow(); const r = await api.post(resource('/preview')); setLink(`${location.origin}/admin/site-designer/preview/${r.token}`); } catch (e) { toast.error(e.message); } };
  const publish = async () => {
    try {
      await saveNow();
      const result = await api.post(resource('/publish'));
      toast.ok(`Published website version ${result.version}. The previous live version remains in history.`);
      setPublishDialog(false); draft.reload(); hist.reload();
    } catch (e) { toast.error(e.message); }
  };
  const previewSubmission = async version => {
    try {
      const previewPath = `/api/super-admin/deployments/${encodeURIComponent(version.id)}/preview`;
      const [result, previewData] = await Promise.all([
        api.get(previewPath),
        api.get(`/api/super-admin/site-designer/clubs/${encodeURIComponent(version.club_id)}/preview-data`),
      ]);
      setReviewPreview({ version, config: result.config, clubId: result.club_id, courts: previewData.courts, events: previewData.events });
    } catch (e) { toast.error(e.message); }
  };
  const Left = <div className="space-y-2"><h2>Sections</h2><Button variant={tab === 'brand' ? 'primary' : 'secondary'} full onClick={() => { setTab('brand'); setMobilePane('settings'); }}>Club name and meaning</Button>{cfg.sections.map((x, i) => <div key={x.id} draggable={!locked} onDragStart={e => e.dataTransfer.setData('text/plain', String(i))} onDragOver={e => e.preventDefault()} onDrop={e => { const from = Number(e.dataTransfer.getData('text/plain')); const n = { ...cfg, sections: [...cfg.sections] }; const [m] = n.sections.splice(from, 1); n.sections.splice(i, 0, m); dirty(n); }} className={`rounded-card border p-2 surface ${x.id === sel ? 'border-court' : 'line'}`}>
    <Button variant="ghost" full onClick={() => { setSel(x.id); setTab('section'); setMobilePane('settings'); }}>{KIND[x.kind]}{!x.visible ? ' (hidden)' : ''}</Button>
    <div className="flex gap-1"><Button variant="ghost" disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label="Move up">Up</Button><Button variant="ghost" disabled={locked || i === cfg.sections.length - 1} onClick={() => move(i, 1)} aria-label="Move down">Down</Button><Button variant="ghost" disabled={locked} onClick={() => set(['sections', i, 'visible'], !x.visible)}>{x.visible ? 'Hide' : 'Show'}</Button></div></div>)}
    <Button variant="secondary" full onClick={() => { setTab('look'); setMobilePane('settings'); }}>Layout, colours and fonts</Button><Button variant="secondary" full onClick={() => { setTab('more'); setMobilePane('settings'); }}>Menu, banner and links</Button><Button variant="secondary" full onClick={() => { setTab('pictures'); setMobilePane('settings'); }}>Pictures</Button></div>;
  const text = (label, path, extra = {}) => <FormField key={path.join()} label={label} value={path.reduce((o, k) => o[k], cfg) ?? ''} onChange={e => set(path, e.target.value)} disabled={locked} {...extra} />;
  const Right = <div className="space-y-4">
    {tab === 'brand' && <><h2>Club name and meaning</h2><p className="muted">{isSuperAdmin ? 'Edit the selected club identity. Preview before publishing; the previous live version remains available in history.' : 'Tell players who your club is. Your changes stay private until you submit them and the Super Admin approves and deploys them.'}</p>{text('Club display name', ['brand', 'name'], { maxLength: 80, required: true, placeholder: 'For example, DinkNest' })}{text('What your club name means', ['brand', 'meaning'], { textarea: true, rows: 4, maxLength: 240, required: true, placeholder: 'Share the story behind your club name.' })}</>}
    {tab === 'section' && s && <><h2>{KIND[s.kind]}</h2>{text('Heading', [...sp(idx), 'title'])}
      {s.kind === 'hero' && <>{text('Sub heading', [...sp(idx), 'subtitle'], { textarea: true })}{text('Button words', [...sp(idx), 'button'])}{pickImg('Background picture', s.content.image, v => set([...sp(idx), 'image'], v))}</>}
      {s.kind === 'about_contact' && <>{text('About text', [...sp(idx), 'text'], { textarea: true })}{text('Address', [...sp(idx), 'address'])}{text('Phone', [...sp(idx), 'phone'])}{text('Email', [...sp(idx), 'email'])}{text('Map search words', [...sp(idx), 'mapQuery'], { helper: 'For example: DinkNest Pickleball, Cagayan de Oro' })}</>}
      {s.kind === 'gallery' && <div><p className="font-medium mb-1">Gallery pictures (tap to add or remove)</p><div className="flex flex-wrap gap-2">{imgs.map(m => { const on = s.content.images.includes(m.path); return <ImageChoice key={m.id} src={mediaUrl(m.path)} selected={on} onClick={() => set([...sp(idx), 'images'], on ? s.content.images.filter(p => p !== m.path) : [...s.content.images, m.path])} />; })}</div></div>}
      {s.kind === 'testimonials' && <>{s.content.items.map((it, i) => <Card key={i} className="space-y-2">{text('Name', [...sp(idx), 'items', i, 'name'])}{text('What they said', [...sp(idx), 'items', i, 'text'], { textarea: true })}<Button variant="ghost" onClick={() => set([...sp(idx), 'items'], s.content.items.filter((_, j) => j !== i))}>Remove</Button></Card>)}<Button variant="secondary" disabled={locked} onClick={() => set([...sp(idx), 'items'], [...s.content.items, { name: '', text: '' }])}>Add a quote</Button></>}
      {s.kind === 'footer' && <>{text('Footer text', [...sp(idx), 'text'])}{s.content.links.map((l, i) => <div key={i} className="grid grid-cols-2 gap-2">{text('Link words', [...sp(idx), 'links', i, 'label'])}{text('Link address (https://)', [...sp(idx), 'links', i, 'url'])}</div>)}<Button variant="secondary" disabled={locked} onClick={() => set([...sp(idx), 'links'], [...s.content.links, { label: '', url: 'https://' }])}>Add a link</Button></>}</>}
    {tab === 'look' && <><h2>Layout, colours and fonts</h2><div className="grid gap-2">{TEMPLATES.map(([k, l, d]) => <Button key={k} variant={cfg.template === k ? 'primary' : 'secondary'} disabled={locked} onClick={() => set(['template'], k)}>{l} - {d}</Button>)}</div>
      {[['primary', 'Main colour (buttons, header)'], ['accent', 'Highlight colour'], ['background', 'Page background'], ['text', 'Text colour']].map(([k, l]) => <div key={k}><label className="block font-medium mb-1">{l}</label><div className="flex gap-2"><input type="color" aria-label={l} value={cfg.theme[k]} disabled={locked} onChange={e => set(['theme', k], e.target.value.toUpperCase())} className="h-11 w-14 rounded-card" /><input aria-label={`${l} code`} value={cfg.theme[k]} disabled={locked} onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && set(['theme', k], e.target.value.toUpperCase())} className="min-h-tap rounded-card border line surface px-3 w-32" /></div></div>)}
      <p className="text-sm muted">If the colours are too close, a message appears when saving. Text must be easy to read.</p>
      <FormField label="Heading font" options={opts.data?.fonts || []} value={cfg.theme.headingFont} onChange={e => set(['theme', 'headingFont'], e.target.value)} disabled={locked} /><FormField label="Body font" options={opts.data?.fonts || []} value={cfg.theme.bodyFont} onChange={e => set(['theme', 'bodyFont'], e.target.value)} disabled={locked} />{pickImg('Logo', cfg.logo, v => set(['logo'], v))}</>}
    {tab === 'more' && <><h2>Menu, banner and links</h2>{Object.keys(cfg.menu).map(k => text(`Menu: ${k}`, ['menu', k]))}<FormField type="checkbox" label="Show an announcement banner" value={cfg.banner.enabled} onChange={e => set(['banner', 'enabled'], e.target.value)} disabled={locked} />{text('Banner words', ['banner', 'text'])}{['facebook', 'instagram', 'tiktok'].map(k => text(`${k[0].toUpperCase() + k.slice(1)} link (https://)`, ['social', k]))}{text('Search title (SEO)', ['seo', 'title'])}{text('Search description (SEO)', ['seo', 'description'], { textarea: true })}</>}
    {tab === 'pictures' && <><h2>Pictures</h2><FileUpload label="Add a picture" helper="JPG or PNG, up to 5 MB." onChange={upload} /><div className="grid grid-cols-3 gap-2">{imgs.map(m => <img key={m.id} src={mediaUrl(m.path)} alt="" className="h-24 w-full object-cover rounded-card" loading="lazy" />)}</div></>}
  </div>;
  return <><PageHeader title="Site Designer" subtitle={isSuperAdmin ? 'Design, preview, and publish an audited club website version.' : "Shape your club's public identity. Your submission goes live only after Super Admin approval and deployment."} action={{ label: isSuperAdmin ? 'Publish changes' : 'Submit for approval', onClick: () => isSuperAdmin ? setPublishDialog(true) : setSub(true), disabled: locked || publishBlocked }} />
    {isSuperAdmin && <Card className="mb-3 flex flex-wrap items-center gap-3"><label htmlFor="designer-club" className="font-semibold">Designing site for</label><select id="designer-club" value={clubId} onChange={event => setClubId(event.target.value)} className="min-h-tap rounded-card border line surface px-3 py-2 min-w-56">{(clubs.data || []).map(club => <option key={club.id} value={club.id}>{club.name} ({club.status})</option>)}</select>{selectedClub?.website_url ? <a href={selectedClub.website_url} target="_blank" rel="noreferrer">{selectedClub.website_url}</a> : <span className="muted text-sm">No verified club domain is ready for public launch.</span>}</Card>}
    {isSuperAdmin && <Card className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2"><h2 className="m-0">Admin designs waiting for review</h2>{pendingReviews.length > 0 && <StatusBadge status="submitted" />}<span className="muted">{pendingReviews.length} {pendingReviews.length === 1 ? 'submission' : 'submissions'}</span><span className="flex-1" /><Button variant="secondary" onClick={() => navigate(deploymentsPath)}>Open approval queue</Button></div>
      {reviewQueue.loading ? <Skeleton lines={2} /> : reviewQueue.error ? <ErrorPanel error={reviewQueue.error} onRetry={reviewQueue.reload} /> : pendingReviews.length
        ? <div className="grid gap-3 sm:grid-cols-2">{pendingReviews.map(version => <div key={version.id} className="rounded-card border line p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{version.club_name} · Version {version.version_no}</p><StatusBadge status={version.status} /></div>
          {version.note && <p className="text-sm">Admin note: {version.note}</p>}
          <ul className="list-disc pl-5 text-sm">{version.change_summary.map(change => <li key={change}>{change}</li>)}</ul>
          <Button variant="secondary" onClick={() => previewSubmission(version)}>Preview submitted design</Button>
        </div>)}</div>
        : <p className="muted">No Admin designs are currently submitted. New submissions will appear here.</p>}
    </Card>}
    {locked && <Card className="mb-3 border-clay"><p>Your design is waiting for the Super Admin to review. You can edit again after they reply.</p></Card>}
    {publishBlocked && <Card className="mb-3 border-clay"><p>An Admin design for this club is waiting for review or deployment. Resolve it in Deployments before publishing a Super Admin edit.</p></Card>}
    {status === 'changes_requested' && draft.data.review_note && <Card className="mb-3 border-clay"><p className="font-medium">The Super Admin asked for changes:</p><p>{draft.data.review_note}</p></Card>}
    <div className="flex flex-wrap items-center gap-2 mb-3"><StatusBadge status={status === 'draft' ? 'draft' : status} /><span className="muted" role="status">{saved}</span>{err && <span className="text-alert" role="alert">{err}</span>}
      <span className="flex-1" />{['mobile', 'tablet', 'desktop'].map(w => <Button key={w} variant={width === w ? 'primary' : 'secondary'} onClick={() => setWidth(w)}>{w[0].toUpperCase() + w.slice(1)}</Button>)}<Button variant="ghost" onClick={() => setDark(!dark)}>{dark ? 'Light preview' : 'Dark preview'}</Button>{!isSuperAdmin && <Button variant="ghost" icon={Eye} onClick={preview}>Private preview link</Button>}<Button variant="ghost" onClick={() => setHs(true)}>Version history</Button><Button variant="ghost" disabled={locked} onClick={() => setDiscard(true)}>Discard draft</Button></div>
    <div className="xl:hidden flex gap-2 mb-3">{[['sections', 'Sections'], ['preview', 'Preview'], ['settings', 'Edit']].map(([k, l]) => <Button key={k} variant={mobilePane === k ? 'primary' : 'secondary'} onClick={() => setMobilePane(k)}>{l}</Button>)}</div>
    <div className="grid gap-4 xl:h-[calc(100dvh-14rem)] xl:min-h-[30rem] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
      <aside className={`${mobilePane === 'sections' ? '' : 'hidden xl:block'} xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain`} aria-label="Website sections">{Left}</aside>
      <section className={`min-w-0 ${mobilePane === 'preview' ? '' : 'hidden xl:block'} xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain`} aria-label="Full-page website preview" tabIndex={0}><SitePreview config={cfg} width={width} dark={dark} courts={siteCourts} events={siteEvents} clubId={isSuperAdmin ? clubId : undefined} /></section>
      <aside className={`${mobilePane === 'settings' ? '' : 'hidden xl:block'} xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain`} aria-label="Website settings">{Right}</aside>
    </div>
    <Drawer open={sub} onClose={() => setSub(false)} title="Submit for approval" footer={<><Button variant="secondary" onClick={() => setSub(false)}>Cancel</Button><Button onClick={submit}>Send for approval</Button></>}><div className="space-y-3"><p>Your club owner submission is sent to the Super Admin. It only goes live after approval and deployment.</p><FormField label="Note for the Super Admin (optional)" textarea value={note} onChange={e => setNote(e.target.value)} placeholder="New club story or a banner for our opening" /></div></Drawer>
    <ConfirmDialog open={publishDialog} title="Publish this club site?" text={`This creates a live, audited version for ${selectedClub?.name || 'the selected club'}. The previous live version remains in history and can be restored.`} confirmLabel="Publish changes" cancelLabel="Review again" onCancel={() => setPublishDialog(false)} onConfirm={publish} />
    <Drawer open={!!reviewPreview} onClose={() => setReviewPreview(null)} title={reviewPreview ? `${reviewPreview.version.club_name} · Submitted version ${reviewPreview.version.version_no}` : ''}>
      {reviewPreview && <div className="space-y-3"><p>Review this submitted draft before approving it. It is not live yet.</p><SitePreview config={reviewPreview.config} clubId={reviewPreview.clubId} courts={reviewPreview.courts || []} events={reviewPreview.events || []} width="desktop" /><Button onClick={() => { setReviewPreview(null); navigate(deploymentsPath); }}>Open approval actions</Button></div>}
    </Drawer>
    <Drawer open={hs} onClose={() => setHs(false)} title="Version history">{(hist.data || []).map(v => <Card key={v.id} className="mb-2"><div className="flex justify-between gap-2"><p className="font-medium">Version {v.version_no}</p><StatusBadge status={v.status} /></div><p className="muted text-sm">{new Date(v.updated_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>{v.note && <p>{v.note}</p>}{v.review_note && <p className="text-sm">Review: {v.review_note}</p>}</Card>)}</Drawer>
    <Drawer open={!!link} onClose={() => setLink(null)} title="Private preview link">{link && <div className="space-y-3"><p>Anyone with this link who is logged in can see your draft for one hour.</p><p className="font-mono break-all rounded-card border line p-3 select-all">{link}</p></div>}</Drawer>
    <ConfirmDialog open={discard} danger title="Throw away this draft?" text="Your unsent changes are removed. The live website does not change." confirmLabel="Yes, discard draft" cancelLabel="No, keep editing" onCancel={() => setDiscard(false)} onConfirm={async () => { await api.del(resource('/draft')); setDiscard(false); draft.reload(); toast.ok('Draft discarded.'); }} /></>;
}
