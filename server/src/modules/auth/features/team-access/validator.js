exports.login = b => { const e = {}; if (!b.email) e.email = 'Type your work email.'; if (!b.password) e.password = 'Type your password.'; return e; };
