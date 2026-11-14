import { CheckCircle2, Clock, XCircle, AlertTriangle, Ban, Info } from '../lib/icons';
// Every status shows a colour, an icon AND a word, so nobody depends on colour alone.
const TONES = { green: 'bg-court/15 text-court dark:text-volt', blue: 'bg-blue-court/15 text-blue-court dark:text-[#7DB9F5]', orange: 'bg-clay/15 text-clay', red: 'bg-alert/15 text-alert', slate: 'bg-slate-dn/15 text-slate-dn dark:text-[#A9B8C7]' };
const ICON = { green: CheckCircle2, blue: Info, orange: Clock, red: XCircle, slate: Ban, warn: AlertTriangle };
const MAP = {
  pending: ['Held for you', 'orange'], confirmed: ['You are booked', 'green'], cancelled: ['Cancelled', 'red'], completed: ['Done', 'green'], no_show: ['Did not show', 'red'], expired: ['Hold ended', 'slate'],
  unpaid: ['Not paid yet', 'orange'], pending_verification: ['Waiting for check', 'orange'], approved: ['Payment accepted', 'green'], rejected: ['Payment not accepted', 'red'], pay_at_court_pending: ['Pay at the court', 'orange'], paid_at_court: ['Paid at the court', 'green'],
  available: ['Available', 'blue'], maintenance: ['Maintenance', 'orange'], closed: ['Closed', 'slate'], blocked: ['Blocked', 'slate'],
  invited: ['Invited', 'orange'], active: ['Active', 'green'], suspended: ['Suspended', 'red'], archived: ['Removed', 'slate'], inactive: ['Inactive', 'slate'], pending_verification_player: ['Pending check', 'orange'],
  draft: ['Draft', 'slate'], registration_open: ['Open for sign-up', 'green'], registration_closed: ['Sign-up closed', 'orange'], in_progress: ['Under way', 'blue'], scheduled: ['Scheduled', 'blue'], forfeited: ['Forfeited', 'red'],
  waitlisted: ['Waitlist', 'orange'], withdrawn: ['Withdrawn', 'slate'], open: ['Open', 'green'], full: ['Full', 'orange'], expiring: ['Ends soon', 'orange'], submitted: ['Waiting for review', 'orange'], changes_requested: ['Changes asked', 'orange'], live: ['Live', 'green'],
  new: ['New', 'blue'], reviewing: ['Reviewing', 'orange'], accepted: ['Accepted', 'green'], done: ['Done', 'green'], declined: ['Declined', 'red'], requested: ['Asked to join', 'orange'], declined_member: ['Declined', 'red'],
};
export default function StatusBadge({ status, label, tone }) {
  const [text, t] = MAP[status] || [String(status || '').replace(/_/g, ' '), 'slate']; const tn = tone || t; const I = ICON[tn] || Info;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${TONES[tn]}`}><I size={16} aria-hidden="true" /><span>{label || text}</span></span>;
}
