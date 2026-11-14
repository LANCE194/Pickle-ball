process.env.NODE_ENV = 'test';
process.env.SMS_PROVIDER = 'twilio';
process.env.TWILIO_ACCOUNT_SID = 'ACtest';
process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
process.env.TWILIO_FROM_NUMBER = '+15005550006';

const test = require('node:test');
const assert = require('node:assert/strict');
const env = require('../../config/env');
const sms = require('../services/sms');

test('Twilio SMS sends Philippines mobile numbers as E.164', async t => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, status: 201, json: async () => ({ sid: 'SMtest', status: 'queued' }) };
  };

  const result = await sms.send('0917 123 4567', 'Test message');
  const body = new URLSearchParams(request.options.body);
  assert.equal(result.status, 'queued');
  assert.equal(request.url, 'https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages.json');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, `Basic ${Buffer.from('ACtest:test-auth-token').toString('base64')}`);
  assert.equal(body.get('To'), '+639171234567');
  assert.equal(body.get('From'), '+15005550006');
  assert.equal(body.get('Body'), 'Test message');
});

test('Twilio SMS rejects invalid recipient numbers without making a request', async t => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  let called = false;
  global.fetch = async () => { called = true; };

  await assert.rejects(sms.send('12345', 'Test message'), /valid Philippines mobile number/);
  assert.equal(called, false);
});

test('Twilio SMS surfaces provider rejection status', async t => {
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => ({ ok: false, status: 401 });

  await assert.rejects(sms.send('09171234567', 'Test message'), /HTTP 401/);
});

test('SMS delivery fails clearly when credentials or a sender are missing', async t => {
  const originalFetch = global.fetch;
  const originalConfig = { ...env.sms };
  t.after(() => {
    global.fetch = originalFetch;
    Object.assign(env.sms, originalConfig);
  });
  let called = false;
  global.fetch = async () => { called = true; };
  env.sms.authToken = '';

  assert.equal(sms.isConfigured(), false);
  await assert.rejects(sms.send('09171234567', 'Test message'), /not configured/);
  assert.equal(called, false);
});
