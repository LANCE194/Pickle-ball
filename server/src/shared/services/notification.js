const { query } = require('../../config/db');
const env = require('../../config/env');
const realtime = require('../../realtime/gateway');
const feature = require('./feature');
const sms = require('./sms');
const { DEFAULT_CLUB_ID } = require('./tenant');
const { HttpError } = require('../utils');
let transporter = null;
let smsConfigurationWarningLogged = false;
function mailer() {
  if (transporter !== null) return transporter;
  if (env.smtp.host) transporter = require('nodemailer').createTransport({ host: env.smtp.host, port: env.smtp.port, auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined });
  else transporter = false;
  return transporter;
}
/** In-app notification (core) + optional email and SMS delivery. */
async function notify(userId, title, body, kind = 'info', clubId, { forceEmail = false, inAppOnly = false } = {}) {
  const { rows: users } = await query('SELECT club_id, email, mobile FROM users WHERE id=$1', [userId]);
  const user = users[0];
  if (!user) throw new HttpError(404, 'Notification recipient was not found.', 'RECIPIENT_NOT_FOUND');
  const notificationClubId = user.club_id || clubId || DEFAULT_CLUB_ID;
  const { rows: inserted } = await query('INSERT INTO notifications (club_id, user_id, title, body, kind) VALUES ($1,$2,$3,$4,$5) RETURNING id', [notificationClubId, userId, title, body, kind]);
  const notificationId = inserted[0].id;
  realtime.publish(`user:${userId}`, 'notification.new', { id: notificationId, title, body, kind });
  if (!inAppOnly && (forceEmail || await feature.isEnabled('email_notifications', user.club_id || DEFAULT_CLUB_ID))) {
    if (user.email) {
      const m = mailer();
      if (m) m.sendMail({ from: env.smtp.from, to: user.email, subject: title, text: body }).then(() => query('UPDATE notifications SET emailed_at=now() WHERE id=$1', [notificationId])).catch(e => console.error('mail failed', e.message));
      else if (kind === 'otp') console.error('OTP email was not sent because SMTP is not configured.');
      else console.log(`[email stub] to=${user.email} subject="${title}"\n${body}`);
    }
  }
  if (!inAppOnly && await feature.isEnabled('sms_notifications', user.club_id || DEFAULT_CLUB_ID) && user.mobile) {
    if (!sms.isConfigured()) {
      if (!smsConfigurationWarningLogged) {
        console.error('SMS notifications are enabled, but Twilio SMS is not configured.');
        smsConfigurationWarningLogged = true;
      }
    } else {
      try {
        await sms.send(user.mobile, `${title}\n${body}`);
      } catch (error) {
        console.error(`SMS delivery failed for user ${userId}:`, error.message);
      }
    }
  }
  return notificationId;
}
async function notifyRoles(roles, title, body, kind = 'info', options) {
  const { rows } = await query(`SELECT id FROM users WHERE role = ANY($1) AND status='active'`, [roles]);
  for (const r of rows) await notify(r.id, title, body, kind, undefined, options);
}
module.exports = { notify, notifyRoles };
