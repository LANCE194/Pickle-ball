const crypto = require('node:crypto');
const dns = require('node:dns').promises;
const net = require('node:net');
const env = require('../../../../config/env');
const { query } = require('../../../../config/db');
const { audit } = require('../../../../shared/services/audit');
const { DEFAULT_CLUB_ID, normalizeHost, isLocalHost, clubSubdomainHost } = require('../../../../shared/services/tenant');
const { HttpError } = require('../../../../shared/utils');

const challengeValue = token => `dinknest-verification=${token}`;
const newToken = () => crypto.randomBytes(24).toString('hex');
const defaultHosts = new Set(env.defaultClubHosts.map(normalizeHost).filter(Boolean));

function normalizeDomain(input) {
  const raw = String(input || '').trim();
  const host = normalizeHost(raw);
  if (!host || !/^[a-z0-9.-]+$/i.test(raw) || net.isIP(host) || !host.includes('.') || isLocalHost(host)) {
    throw new HttpError(422, 'Enter a public domain name without a scheme, path, or port.', 'INVALID_DOMAIN');
  }
  if (defaultHosts.has(host)) throw new HttpError(409, 'This host is already assigned to the default club.', 'DOMAIN_IN_USE');
  return host;
}

function withChallenge(row) {
  return {
    ...row,
    txt_name: `_dinknest.${row.host}`,
    txt_value: challengeValue(row.verification_token),
    https_ready: Boolean(row.https_ready),
  };
}

async function getDomain(id) {
  const { rows } = await query('SELECT * FROM club_domains WHERE id=$1', [id]);
  if (!rows[0]) throw new HttpError(404, 'Domain not found.', 'DOMAIN_NOT_FOUND');
  return rows[0];
}

exports.list = async () => {
  const [{ rows: domains }, { rows: clubs }] = await Promise.all([
    query(`SELECT d.*, c.name AS club_name, c.status AS club_status
      FROM club_domains d JOIN clubs c ON c.id=d.club_id ORDER BY c.name, d.host`),
    query('SELECT id, name, slug, status FROM clubs WHERE status <> $1 ORDER BY name', ['archived']),
  ]);
  return {
    domains: domains.map(withChallenge),
    clubs: clubs.map(club => {
      const host = club.status === 'active' ? clubSubdomainHost(club.slug) : null;
      return { ...club, website_url: host ? `https://${host}` : null };
    }),
  };
};

exports.create = async ({ clubId, host } = {}, req) => {
  const normalized = normalizeDomain(host);
  const targetClubId = String(clubId || '').trim();
  if (!targetClubId) throw new HttpError(422, 'Choose a club for this domain.', 'INVALID_CLUB');
  const { rows: clubs } = await query('SELECT id FROM clubs WHERE id=$1 AND status <> $2', [targetClubId, 'archived']);
  if (!clubs.length) throw new HttpError(404, 'Club not found or archived.', 'CLUB_NOT_FOUND');
  const { rows: existing } = await query('SELECT id FROM club_domains WHERE lower(host)=lower($1)', [normalized]);
  if (existing.length) throw new HttpError(409, 'This domain is already assigned.', 'DOMAIN_IN_USE');
  const token = newToken();
  const { rows } = await query(`INSERT INTO club_domains (club_id, host, verification_status, verification_token, https_ready)
    VALUES ($1,$2,'pending',$3,false) RETURNING *`, [targetClubId, normalized, token]);
  await audit(req, 'domain.created', 'club_domain', rows[0].id, { club_id: targetClubId, host: normalized });
  return withChallenge(rows[0]);
};

exports.verifyDns = async (id, req, resolveTxt = dns.resolveTxt) => {
  const domain = await getDomain(id);
  if (domain.verification_status === 'disabled') throw new HttpError(409, 'Re-enable this domain before verifying it.', 'DOMAIN_DISABLED');
  const txtName = `_dinknest.${domain.host}`;
  let records;
  try {
    records = await resolveTxt(txtName);
  } catch (error) {
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      throw new HttpError(422, `The TXT record ${txtName} was not found yet. Add the record and try again.`, 'DOMAIN_DNS_PENDING');
    }
    if (['EAI_AGAIN', 'ETIMEOUT', 'SERVFAIL'].includes(error.code)) {
      throw new HttpError(503, 'DNS lookup is temporarily unavailable. Try again shortly.', 'DNS_LOOKUP_FAILED');
    }
    throw error;
  }
  const expected = challengeValue(domain.verification_token);
  const found = records.some(parts => parts.join('') === expected);
  if (!found) throw new HttpError(422, `The TXT record ${txtName} does not match the challenge yet.`, 'DOMAIN_DNS_MISMATCH');
  const { rows } = await query(`UPDATE club_domains
    SET verification_status='verified', verified_at=now(), https_ready=false, updated_at=now()
    WHERE id=$1 RETURNING *`, [id]);
  await audit(req, 'domain.dns_verified', 'club_domain', id, { host: domain.host, txt_name: txtName });
  return { ...withChallenge(rows[0]), message: 'DNS ownership verified. Confirm HTTPS readiness separately before the domain can serve club content.' };
};

exports.confirmHttpsReady = async (id, body, req) => {
  if (!body || body.confirmed !== true) throw new HttpError(422, 'Confirm that the domain has a valid HTTPS certificate and redirects or blocks plain HTTP.', 'HTTPS_CONFIRMATION_REQUIRED');
  const domain = await getDomain(id);
  if (domain.verification_status !== 'verified') throw new HttpError(409, 'Verify DNS ownership before confirming HTTPS readiness.', 'DOMAIN_NOT_VERIFIED');
  const { rows } = await query(`UPDATE club_domains SET https_ready=true, updated_at=now()
    WHERE id=$1 RETURNING *`, [id]);
  await audit(req, 'domain.https_ready_confirmed', 'club_domain', id, { host: domain.host });
  return { ...withChallenge(rows[0]), message: 'HTTPS readiness recorded. The domain can resolve only when its club is active and multi-club access is enabled.' };
};

exports.rotateChallenge = async (id, req) => {
  const domain = await getDomain(id);
  if (domain.verification_status === 'disabled') throw new HttpError(409, 'Re-enable this domain before rotating its challenge.', 'DOMAIN_DISABLED');
  const token = newToken();
  const { rows } = await query(`UPDATE club_domains SET verification_status='pending', verification_token=$2,
    https_ready=false, verified_at=NULL, updated_at=now() WHERE id=$1 RETURNING *`, [id, token]);
  await audit(req, 'domain.challenge_rotated', 'club_domain', id, { host: domain.host });
  return withChallenge(rows[0]);
};

exports.enable = async (id, req) => {
  const domain = await getDomain(id);
  if (domain.verification_status !== 'disabled') throw new HttpError(409, 'This domain is already enabled.', 'DOMAIN_ALREADY_ENABLED');
  const token = newToken();
  const { rows } = await query(`UPDATE club_domains SET verification_status='pending', verification_token=$2,
    https_ready=false, verified_at=NULL, updated_at=now() WHERE id=$1 RETURNING *`, [id, token]);
  await audit(req, 'domain.enabled', 'club_domain', id, { host: domain.host });
  return withChallenge(rows[0]);
};

exports.disable = async (id, req) => {
  const domain = await getDomain(id);
  const { rows } = await query(`UPDATE club_domains SET verification_status='disabled', https_ready=false, updated_at=now()
    WHERE id=$1 RETURNING *`, [id]);
  await audit(req, 'domain.disabled', 'club_domain', id, { host: domain.host });
  return withChallenge(rows[0]);
};

exports.normalizeDomain = normalizeDomain;
exports.DEFAULT_CLUB_ID = DEFAULT_CLUB_ID;
