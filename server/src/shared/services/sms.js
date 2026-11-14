const env = require('../../config/env');
const { normalizeMobile } = require('../utils');

function isConfigured() {
  return String(env.sms.provider).toLowerCase() === 'twilio'
    && Boolean(env.sms.accountSid && env.sms.authToken && (env.sms.fromNumber || env.sms.messagingServiceSid));
}

function recipientNumber(value) {
  const mobile = normalizeMobile(value);
  if (!mobile) throw new Error('Recipient must be a valid Philippines mobile number.');
  return `+63${mobile.slice(1)}`;
}

async function send(to, message) {
  const provider = String(env.sms.provider).toLowerCase();
  if (provider && provider !== 'twilio') throw new Error(`Unsupported SMS provider: ${env.sms.provider}.`);
  if (!isConfigured()) throw new Error('Twilio SMS is not configured. Set SMS_PROVIDER, Twilio credentials, and a sender.');

  const text = String(message ?? '').trim();
  if (!text) throw new Error('SMS message cannot be empty.');

  const body = new URLSearchParams({ To: recipientNumber(to), Body: text });
  if (env.sms.messagingServiceSid) body.set('MessagingServiceSid', env.sms.messagingServiceSid);
  else body.set('From', env.sms.fromNumber);

  const authorization = Buffer.from(`${env.sms.accountSid}:${env.sms.authToken}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.sms.accountSid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!response.ok) throw new Error(`Twilio rejected the SMS with HTTP ${response.status}.`);
  return response.json();
}

module.exports = { isConfigured, send };
