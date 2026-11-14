const t = require('../../../../shared/services/tournaments');
const bracket = require('../../../../shared/services/bracket');
const reports = require('../../../../shared/services/reports');
const { audit } = require('../../../../shared/services/audit');
exports.list = () => t.list({ includeDraft: true });
exports.create = async (b, req) => { const x = await t.save(b, req.user); await audit(req, 'tournament.create', 'tournament', x.id); return x; };
exports.update = async (id, b, req) => { const x = await t.save(b, req.user, id); await audit(req, 'tournament.update', 'tournament', id); return x; };
exports.status = async (id, status, req) => { const x = await t.setStatus(id, status, req.user); await audit(req, 'tournament.status', 'tournament', id, { status }); return x; };
exports.entries = t.entries;
exports.decide = async (entryId, status, req) => { const e = await t.decideEntry(entryId, status); if (['rejected'].includes(status)) await t.promoteWaitlist(e.tournament_id); await audit(req, 'tournament.entry.' + status, 'tournament_entry', entryId); return e; };
// After registration closes: seed by rating, build bracket or pools, assign courts and times with no court conflicts and rest time.
exports.generate = async (id, req) => { const r = await bracket.generate(id, req.user.id); await audit(req, 'tournament.generate', 'tournament', id, r); return { ...r, message: `Bracket built with ${r.matches} matches.` }; };
exports.matches = t.matches;
exports.pdf = async id => reports.bracketPdf(await t.get(id, { includeDraft: true }), await t.matches(id));
