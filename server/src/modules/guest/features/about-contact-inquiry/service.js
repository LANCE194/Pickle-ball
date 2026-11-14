const site = require('../../../../shared/services/site');
const inquiries = require('../../../../shared/services/inquiries');
exports.about = async req => { const p = await site.publicConfig(req.club && req.club.id); const s = p.config.sections.find(x => x.kind === 'about_contact'); return { about: s ? s.content : null, privacy_notice: 'We use your details only to reply to your message, as required by the Philippine Data Privacy Act.' }; };
exports.inquiry = async b => { await inquiries.submit(b); return { ok: true, message: 'Thank you. The club will contact you soon.' }; };
