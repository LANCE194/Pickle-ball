exports.request = b => (b.contact ? {} : { contact: 'Type the mobile number or email the club has on file.' });
exports.verify = b => { const e = {}; if (!b.contact) e.contact = 'Type your mobile number or email.'; if (!/^\d{6}$/.test(String(b.code || ''))) e.code = 'Type the 6-digit code.'; return e; };
