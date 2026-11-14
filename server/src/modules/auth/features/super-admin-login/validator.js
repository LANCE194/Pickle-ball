exports.login = b => { const e = {}; if (!b.email) e.email = 'Type your email.'; if (!b.password) e.password = 'Type your password.'; return e; };
exports.setupToken = b => (b.setupToken ? {} : { setupToken: 'Please start again.' });
exports.setupPassword = b => (b.setupToken && b.newPassword ? {} : { newPassword: 'Type a new password.' });
exports.confirm = b => (/^\d{6}$/.test(String(b.code || '')) ? {} : { code: 'Type the 6-digit code from your app.' });
