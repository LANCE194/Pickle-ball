import { useEffect, useState } from 'react';
import { api } from '../../../../../shared/lib/api';
import { useApi } from '../../../../../shared/hooks/useApi';
import { useSession } from '../../../../../shared/hooks/useSession';
import { useToast } from '../../../../../shared/components/Toast';
import Button from '../../../../../shared/components/Button';
import Card from '../../../../../shared/components/Card';
import PageHeader from '../../../../../shared/components/PageHeader';

const BASE = '/api/chat/messages';
const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
  player: 'Player',
  coach_referee: 'Coach / Referee',
};
const CONTACT_ROLES = {
  super_admin: ['admin'],
  admin: ['super_admin', 'staff', 'coach_referee', 'player'],
  staff: ['admin', 'player', 'coach_referee'],
  player: ['staff', 'coach_referee'],
  coach_referee: ['admin', 'staff'],
};

export default function ChatPage() {
  const toast = useToast();
  const { user } = useSession();
  const conversations = useApi(`${BASE}/conversations`, null, { events: ['notification.new'] });
  const [active, setActive] = useState(null);
  const messages = useApi(active ? `${BASE}/conversations/${active.id}/messages` : null, null, {
    enabled: !!active,
    events: ['notification.new'],
  });
  const [term, setTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [contactsOpen, setContactsOpen] = useState(false);
  const [directory, setDirectory] = useState([]);
  const [people, setPeople] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [importingId, setImportingId] = useState(null);

  useEffect(() => {
    let current = true;
    setSearching(true);
    api.get(`${BASE}/users`).then(result => {
      if (current) {
        setDirectory(result);
        setPeople(result);
      }
    }).catch(error => {
      if (current) setSearchError(error.message);
    }).finally(() => {
      if (current) setSearching(false);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    if (term.trim().length < 2) {
      setPeople(directory);
      setSearchError('');
      return () => { current = false; };
    }
    setSearching(true);
    setSearchError('');
    const timer = setTimeout(async () => {
      try {
        const result = await api.get(`${BASE}/users`, { search: term.trim() });
        if (current) setPeople(result);
      } catch (error) {
        if (current) setSearchError(error.message);
      } finally { if (current) setSearching(false); }
    }, 250);
    return () => { current = false; clearTimeout(timer); };
  }, [term, directory]);

  useEffect(() => {
    if (!messages.data?.length) return;
    const loadedIds = new Set(messages.data.map(message => message.id));
    setPendingMessages(current => current.filter(message => !loadedIds.has(message.id)));
  }, [messages.data]);

  async function startConversation(person) {
    try {
      const { id } = await api.post(`${BASE}/conversations`, { userId: person.id });
      setActive({ id, other_name: person.name, other_role: person.role, other_club: person.club_name });
      setTerm('');
      setRoleFilter('all');
      setContactsOpen(false);
      conversations.reload();
    } catch (error) { toast.error(error.message); }
  }

  async function send(event) {
    event.preventDefault();
    if (!active || !body.trim() || busy) return;
    setBusy(true);
    const pendingId = `pending-${Date.now()}`;
    const conversationId = active.id;
    setPendingMessages(current => [...current, {
      id: pendingId,
      conversation_id: conversationId,
      sender_id: user.id,
      body: body.trim(),
      created_at: new Date().toISOString(),
      pending: true,
    }]);
    try {
      const sent = await api.post(`${BASE}/conversations/${conversationId}/messages`, { body });
      setPendingMessages(current => current.map(message => message.id === pendingId
        ? { ...sent, conversation_id: conversationId }
        : message));
      setBody('');
      messages.reload();
      conversations.refresh();
    } catch (error) { toast.error(error.message); }
    finally {
      setPendingMessages(current => current.filter(message => message.id !== pendingId));
      setBusy(false);
    }
  }

  async function importClubBackup(message) {
    if (!window.confirm('Merge this backup into the club named in the backup? Other clubs will not be changed, and this package can only be imported once.')) return;
    setImportingId(message.attachment_id);
    try {
      const result = await api.post(`/api/super-admin/backups/import-club/${message.attachment_id}`);
      toast.ok(`Merged ${result.records} records into ${result.clubName}.`);
    } catch (error) { toast.error(error.message); }
    finally { setImportingId(null); }
  }

  const selected = conversations.data?.find(item => item.id === active?.id) || active;
  const visibleMessages = [
    ...(messages.data || []),
    ...pendingMessages.filter(message =>
      message.conversation_id === active?.id && !messages.data?.some(loaded => loaded.id === message.id)),
  ];
  const visiblePeople = people.filter(person => roleFilter === 'all' || person.role === roleFilter);
  const contactRoles = CONTACT_ROLES[user?.role] || [];
  return <>
    <PageHeader title="Messages" subtitle="Find the people your role can message and start a direct conversation." />
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.6fr)]">
      <Card className="p-0 overflow-hidden">
        <div className="p-3 border-b line">
          <label htmlFor="chat-search" className="block text-sm font-medium mb-1">Start a conversation</label>
          <input id="chat-search" value={term} onChange={event => setTerm(event.target.value)} maxLength={60}
            onFocus={() => setContactsOpen(true)}
            className="w-full min-h-tap rounded-card border line bg-transparent px-3" placeholder="Search people by name" />
          <label htmlFor="chat-role-filter" className="sr-only">Filter contacts by role</label>
          <select id="chat-role-filter" value={roleFilter} onChange={event => setRoleFilter(event.target.value)}
            className="mt-2 w-full min-h-tap rounded-card border line bg-transparent px-3">
            <option value="all">All allowed roles</option>
            {contactRoles.map(role => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
          </select>
          {contactsOpen && visiblePeople.length > 0 && <ul aria-label="Available contacts" className="mt-2 max-h-64 overflow-y-auto divide-y divide-black/10 dark:divide-white/10">
            {visiblePeople.map(person => <li key={person.id}>
              <Button variant="ghost" full className="justify-start text-left h-auto py-2 px-2 rounded-none"
                onClick={() => startConversation(person)}>
                <span className="block font-medium">{person.name}</span>
                <span className="muted text-sm">{ROLE_LABELS[person.role] || person.role} · {person.club_name}</span>
              </Button>
            </li>)}
          </ul>}
          {searching && <p className="muted text-sm mt-2">Searching…</p>}
          {searchError && <p className="text-alert text-sm mt-2" role="alert">{searchError}</p>}
          {contactsOpen && !searching && !visiblePeople.length && <p className="muted text-sm mt-2">No available contacts match your role and search.</p>}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {conversations.loading && <p className="p-4 muted">Loading conversations…</p>}
          {conversations.error && <div className="p-4"><p role="alert">{conversations.error.message}</p><Button className="mt-2" variant="secondary" onClick={conversations.reload}>Try again</Button></div>}
          {!conversations.loading && !conversations.error && !conversations.data?.length && <p className="p-4 muted">No conversations yet. Search for someone above.</p>}
          {conversations.data?.map(item => <Button key={item.id} variant="ghost" full aria-pressed={active?.id === item.id}
            onClick={() => setActive(item)}
            className={`justify-start text-left h-auto p-3 rounded-none border-b line ${active?.id === item.id ? 'bg-court/10' : ''}`}>
            <span className="flex items-center justify-between gap-2"><strong>{item.other_name}</strong>{Number(item.unread_count) > 0 && <span className="rounded-full bg-court text-white px-2 text-xs">{item.unread_count}</span>}</span>
            <span className="block muted text-sm">{item.other_club} · {ROLE_LABELS[item.other_role] || item.other_role}</span>
            <span className="block text-sm truncate mt-1">{item.last_message || 'Conversation started'}</span>
          </Button>)}
        </div>
      </Card>

      <Card className="min-h-[65vh] flex flex-col">
        {!selected && <div className="m-auto text-center muted">Choose a conversation or search for someone to message.</div>}
        {selected && <>
          <div className="pb-3 border-b line">
            <h2 className="font-semibold">{selected.other_name}</h2>
            <p className="muted text-sm">{selected.other_club} · {ROLE_LABELS[selected.other_role] || selected.other_role}</p>
          </div>
          <div className="flex-1 overflow-y-auto py-3 space-y-3" aria-live="polite">
            {messages.loading && <p className="muted">Loading messages…</p>}
            {messages.error && <div role="alert"><p>{messages.error.message}</p><Button className="mt-2" variant="secondary" onClick={messages.reload}>Try again</Button></div>}
            {visibleMessages.map(message => <div key={message.id} className={`max-w-[85%] rounded-card px-3 py-2 ${message.sender_id === user?.id ? 'ml-auto bg-court text-white' : 'bg-black/5 dark:bg-white/10'}`}>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              {message.attachment_id && <div className="mt-2 border-t border-current/20 pt-2">
                <p className="text-sm font-medium break-all">{message.attachment_name}</p>
                <p className="text-xs opacity-70">{(Number(message.attachment_bytes) / 1024).toFixed(0)} KB · {message.attachment_kind === 'club_backup' ? 'Club backup' : 'Attachment'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="secondary" onClick={() => api.download(`/api/chat/messages/attachments/${message.attachment_id}`, message.attachment_name).catch(error => toast.error(error.message))}>Download backup</Button>
                  {user?.role === 'super_admin' && message.attachment_kind === 'club_backup' && <Button variant="secondary" loading={importingId === message.attachment_id} onClick={() => importClubBackup(message)}>Merge into club</Button>}
                </div>
              </div>}
              <time className="block text-xs opacity-70 mt-1">{message.pending ? 'Sending…' : new Date(message.created_at).toLocaleString()}</time>
            </div>)}
          </div>
          <form onSubmit={send} className="pt-3 border-t line flex items-end gap-2">
            <label className="sr-only" htmlFor="chat-message">Message</label>
            <textarea id="chat-message" value={body} onChange={event => setBody(event.target.value)} maxLength={2000} rows={2}
              className="flex-1 min-h-tap rounded-card border line bg-transparent px-3 py-2 resize-y" placeholder="Write a message" />
            <Button type="submit" loading={busy} disabled={!body.trim()}>Send</Button>
          </form>
        </>}
      </Card>
    </div>
  </>;
}
