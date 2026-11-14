const net = require('net');
const { query } = require('../../config/db');
const env = require('../../config/env');

const DEFAULT_CLUB_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_CLUB = Object.freeze({ id: DEFAULT_CLUB_ID, name: 'Default Club', slug: 'default-club', status: 'active', verified: true });
const DEFAULT_HOSTS = new Set(env.defaultClubHosts.map(normalizeHost).filter(Boolean));

function normalizeHost(input = '') {
  const raw = String(input || '').trim();
  if (!raw || /[,\s@\\]/.test(raw)) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  let url;
  try { url = new URL(candidate); } catch { return null; }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
  let host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || host.length > 253) return null;
  if (net.isIP(host) === 0 && host.split('.').some(label => !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)$/i.test(label))) return null;
  return host;
}

function isLocalHost(input = '') {
  const host = normalizeHost(input);
  return !!host && (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost') || host === 'app');
}

function subdomainBase() {
  const base = normalizeHost(env.clubSubdomainBaseDomain);
  if (!base || net.isIP(base) || !base.includes('.') || isLocalHost(base)) return null;
  return base;
}

function clubSubdomainHost(slug) {
  if (!env.multiClubEnabled || !env.clubSubdomainWildcardReady) return null;
  const base = subdomainBase();
  const value = String(slug || '').trim().toLowerCase();
  if (!base || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value)) return null;
  return `${value}.${base}`;
}

async function resolveClubFromHost(input = '') {
  const host = normalizeHost(input);
  if (!host) return null;
  if ((!env.isProd && isLocalHost(host)) || DEFAULT_HOSTS.has(host)) return { ...DEFAULT_CLUB, host };
  const generatedHost = clubSubdomainHostFromHost(host);
  if (generatedHost) {
    const { rows } = await query("SELECT * FROM clubs WHERE lower(slug)=lower($1) AND status='active' LIMIT 1", [generatedHost]);
    if (rows[0]) return { ...rows[0], host };
  }
  const { rows } = await query(`SELECT c.*, d.host AS domain_host, d.verification_status, d.https_ready
    FROM club_domains d JOIN clubs c ON c.id = d.club_id
    WHERE lower(d.host) = lower($1) AND c.status = 'active' AND d.verification_status = 'verified' AND d.https_ready = 1
    LIMIT 1`, [host]);
  const club = rows[0] || null;
  return club && (club.id === DEFAULT_CLUB_ID || env.multiClubEnabled) ? club : null;
}

function clubSubdomainHostFromHost(host) {
  if (!env.multiClubEnabled || !env.clubSubdomainWildcardReady) return null;
  const base = subdomainBase();
  const suffix = base && `.${base}`;
  if (!suffix || !host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) ? slug : null;
}

function resolveRequestClub(req, _res, next) {
  const host = normalizeHost(req.headers.host || '');
  req.tenantHost = host;
  if (!host) {
    req.club = null;
    req.clubId = null;
    req.tenantBlocked = true;
    return next();
  }
  resolveClubFromHost(host).then(club => {
    req.club = club;
    req.clubId = club ? club.id : null;
    req.tenantBlocked = !club;
    next();
  }, next);
}

module.exports = { DEFAULT_CLUB_ID, DEFAULT_CLUB, normalizeHost, isLocalHost, clubSubdomainHost, resolveClubFromHost, resolveRequestClub };
