process.env.DATABASE_FILE = ':memory:';
process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'https://dinknest.vercel.app';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dinknest-deployment-'));
process.env.STORAGE_DIR = storageDir;

const { migrate } = require('../../scripts/migrate');
migrate();
const { createApp } = require('../../app');

test('public file assets allow cross-origin Vercel rendering', async t => {
  const fileName = '123e4567-e89b-12d3-a456-426614174000.jpg';
  const filePath = path.join(storageDir, 'courts', fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'club court image');

  const server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    fs.rmSync(storageDir, { recursive: true, force: true });
  });

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/files/courts/${fileName}`, {
    headers: { origin: 'https://dinknest.vercel.app' },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://dinknest.vercel.app');
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.equal(await response.text(), 'club court image');
});
