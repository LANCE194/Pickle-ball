// Test helper: when a dependency is not installed (for example in a bare checkout), load a tiny stand-in so the pure-logic tests can still run.
// With `npm install` done, the real packages are used and nothing here is active.
const Module = require('module');
const have = n => { try { require.resolve(n); return true; } catch { return false; } };
const noop = () => (req, res, next) => next && next();
const chain = () => { const r = function () {}; for (const m of ['get', 'post', 'put', 'patch', 'delete', 'use', 'all']) r[m] = () => r; return r; };
const express = () => ({ use() {}, get() {}, post() {}, set() {} }); express.Router = chain; express.json = noop;
const STUBS = {
  express,
  bcryptjs: { hash: async s => 'h:' + s, compare: async (a, b) => b === 'h:' + a },
  'sanitize-html': s => String(s).replace(/<[^>]*>/g, ''), dotenv: { config() {} }, helmet: noop, cors: noop,
  'express-rate-limit': () => noop(), multer: Object.assign(() => ({ single: () => noop() }), { memoryStorage: () => ({}) }),
  otplib: { authenticator: { options: {}, check: () => true, generateSecret: () => 'SECRET', keyuri: () => 'otpauth://x' } },
  ws: { WebSocketServer: class {} }, nodemailer: { createTransport: () => ({}) }, exceljs: {}, pdfkit: class {},
};
const orig = Module._load;
Module._load = function (request, ...rest) { if (request in STUBS && !have(request)) return STUBS[request]; return orig.call(this, request, ...rest); };
