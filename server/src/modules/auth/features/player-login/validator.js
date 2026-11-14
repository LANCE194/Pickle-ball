exports.login = b => { const e = {}; if (!b.identifier) e.identifier = 'Type your mobile number or email.'; if (!b.password) e.password = 'Type your password.'; return e; };
exports.forgot = b => (b.contact ? {} : { contact: 'Type your mobile number or email.' });
exports.reset = b => { const e = {}; if (!b.contact) e.contact = 'Type your mobile number or email.'; if (!/^\d{6}$/.test(String(b.code || ''))) e.code = 'Type the 6-digit code.'; return e; };
