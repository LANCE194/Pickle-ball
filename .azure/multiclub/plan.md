# Implementation Plan: Multi-club onboarding and isolation

**Date:** 2026-11-12 | **Status:** Approved; implementation in progress | **Scope:** Phased implementation

## Summary

Add separate club tenants to the existing Express/SQLite and React/Vite application. A Super Admin will create a club, enter its custom domain, and select requested features before creating its Admin account. Each tenant's users, settings, site, operational data, files, notifications, and feature selections must remain isolated. Existing records stay with a new default club. A club cannot sign in or serve content on its custom domain until domain verification succeeds.

The current application has a single global club configuration and no tenant identifier on business records. This is a multi-tenant architecture change, not only an Add Admin form enhancement.

## Confirmed requirements

- Each Admin manages a separate club with isolated data.
- Existing records are backfilled to a default/current club.
- Clubs use custom domains. Login and content are unavailable until a domain is verified.
- The same email may have a separate account in each club; the custom domain determines tenant context. The global Super Admin remains separate.
- The Super Admin selects features during club setup. Requested features can be approved or declined in that flow; approving a catalog capability does not enable it for other clubs.
- Super Admin support access to club data is read-only, reasoned, time-limited, and audited; it does not impersonate a club user.
- DNS/TLS is provider-neutral in the application: verify ownership with a DNS TXT challenge and require the hosting ingress to provide HTTPS before activation.
- HTTPS readiness is manually confirmed by a Super Admin after the certificate and HTTP-to-HTTPS behavior are checked.
- Admins and Staff with `members_edit` permission can add active player accounts. The creator receives a one-time temporary password, which the player must change at first login.
- Club Admins may edit their own website draft and use a private preview. Only the Super Admin may approve a draft, and approval must be a separate step from deployment.
- The Super Admin selects which approved Admin portal modules and public website features each club may use; Admins can enable or disable only the features approved for their club.
- Clubs receive distinct slug-based subdomains under a configured wildcard domain. The base domain was not provided and must be configured before production links can be generated.
- Active users of all roles may directly message any other active user across clubs. Chat is one-to-one text with notifications and no file sharing.

## Technical Context

**Language/Version:** JavaScript, Node.js >=20; React 18  
**Primary Dependencies:** Express, better-sqlite3 / Node SQLite fallback, Vite, React Router  
**Storage:** SQLite in `data/dinknest.db`; private and public uploads in `data/storage`  
**Testing:** Node test runner; existing server and client tests  
**Target Platform:** Existing single deployment serving API and SPA; multiple verified custom hostnames routed to the same trusted ingress  
**Constraints:** No current `club_id` ownership model; preserve all existing records; unknown/unverified hosts must fail closed; never accept a client-supplied tenant ID as authorization.

## Architecture decisions

1. Add `clubs` and `club_domains`; keep the feature catalog and platform-level Super Admin global.
2. Add tenant ownership to all club-owned data. Keep the Super Admin global; ordinary Admin, Staff, Coach/Referee, and Player accounts belong to one club.
3. Use a normalized, verified request host as the tenant selector. Resolve it before tenant-aware API, static-site, and WebSocket handling. A session must belong to the resolved club.
4. Make identity uniqueness tenant-scoped for email and mobile. The same email may exist in different clubs; login is resolved within the custom domain's club.
5. Convert `club_features` to `(club_id, feature_key)`. Keep feature availability/locks global. Store setup-time requests and approval/decline decisions per club; enable only approved features on that club.
6. During Add Admin, create the club, pending domain, feature decisions, Admin, and profile transactionally. A pending domain may exist, but its tenant cannot serve or authenticate until verified.
7. Preserve the current data under the default club through a numbered SQLite migration. Take a database and storage backup before production cutover.
8. Provide separate, read-only Super Admin support endpoints. Require a reason, prohibit mutations and impersonation, and audit support-session start/end and each data access.
9. Use DNS TXT ownership verification in the app. DNS record changes and HTTPS certificates are provisioned by the club/domain owner and hosting ingress; unknown or pending domains never fall back to the default club.

## Constitution Check

No project `constitution.md` was found. The plan follows existing repository constraints: server-side authorization, password hashes only, numbered SQL migrations, private file handling, and focused Node tests. Add a project constitution before implementation if additional mandatory rules apply.

## Applied Guidelines

- Reuse the repository's numbered migration runner (`server/src/scripts/migrate.js`) and Node test conventions.
- Follow server-side role/feature authorization patterns; client filtering is not a security boundary.
- Keep account creation in the existing Super Admin admins feature and account service, while adding a transactional club-provisioning boundary.
- Preserve existing same-origin API behavior; tenant identity comes only from the resolved host and server-side session.

## Implementation Steps

### Phase 1 — Tenant model and migration

#### Plan 1.1: Create tenant and domain schema
- **Requirements:** REQ-001, REQ-003, REQ-004, REQ-007
- **Design inputs:** Architecture decisions 1–3, 5, 7, 9
- **Description:** Add clubs, custom-domain verification state, tenant IDs, scoped uniqueness/constraints, and required indexes in a numbered migration. Backfill all existing club-owned rows and file metadata to the default club. Keep global catalog and Super Admin records global.

#### Plan 1.2: Verify migration and relational ownership
- **Requirements:** REQ-004, REQ-007
- **Design inputs:** Architecture decisions 2, 4, 7
- **Description:** Rebuild SQLite tables as needed for tenant-aware keys; validate same-club parent references, booking overlap triggers, counts, and foreign keys against a copy of the current database. Document backup/restore rollback.

### Phase 2 — Custom domain and tenant authentication

#### Plan 2.1: Resolve tenant by trusted custom host
- **Requirements:** REQ-002, REQ-003
- **Design inputs:** Architecture decisions 3, 9
- **Description:** Normalize and resolve the trusted host before API, SPA, and WebSocket handling. Reject unknown, pending, disabled, or unverified domains; never default them to the existing club. Define trusted-proxy and forwarded-host rules.

#### Plan 2.2: Bind accounts and sessions to clubs
- **Requirements:** REQ-002, REQ-004
- **Design inputs:** Architecture decisions 2–4
- **Description:** Scope login, activation, OTP, sessions, and password flows to the resolved club. Add tenant-scoped email/mobile uniqueness and ensure a session cannot be reused on another club's host.

#### Plan 2.3: Implement domain verification lifecycle
- **Requirements:** REQ-003
- **Design inputs:** Architecture decisions 3, 6, 9
- **Description:** Add a DNS TXT challenge, Super Admin domain management, and domain status transitions. Permit activation only after ownership verification and manual HTTPS readiness confirmation; pending clubs cannot log in or serve tenant pages.

#### Plan 2.4: Generate per-club subdomains
- **Requirements:** REQ-003, REQ-011
- **Design inputs:** Architecture decisions 3, 6, 9
- **Description:** Generate a stable club subdomain from its slug under a configured wildcard base domain. Fail closed when the base domain or wildcard TLS readiness is missing; keep links inactive until domain and club readiness checks pass.

### Phase 3 — Club provisioning and feature selection

#### Plan 3.1: Add pre-creation club setup to Add Admin
- **Requirements:** REQ-001, REQ-003, REQ-005
- **Design inputs:** Architecture decisions 5, 6, 9
- **Description:** Collect club identity, custom domain, and requested feature selections before creating the Admin. Validate duplicate domains, catalog state, dependencies, and payment-method invariants. Provision club, domain, feature decisions, user, and profile in one transaction.

#### Plan 3.2: Add per-club feature requests and decisions
- **Requirements:** REQ-005
- **Design inputs:** Architecture decisions 5, 6
- **Description:** Allow the Super Admin to approve or decline requested capabilities during setup. Approved catalog availability remains global, while the feature assignment is enabled only for the new club. Declined or pending requests remain disabled and auditable.

#### Plan 3.3: Configure each club's portal and website features
- **Requirements:** REQ-005, REQ-010
- **Design inputs:** Architecture decisions 5, 6
- **Description:** Select enabled Admin portal modules and public website sections per club during provisioning. Admins may toggle only features approved and assigned to their club.

### Phase 4 — Enforce tenant data isolation

#### Plan 4.1: Scope shared services and all API queries
- **Requirements:** REQ-002, REQ-004, REQ-007, REQ-008
- **Design inputs:** Architecture decisions 2–4, 7
- **Description:** Scope every list, search, join, aggregate, create, update, delete, export, and ID-based read across admin, staff, coach/referee, player, guest, and authentication modules. Validate ownership of related IDs; random IDs are not an isolation mechanism. Admins and Staff with `members_edit` permission create active player accounts with one-time temporary passwords and an enforced first-login password change.

#### Plan 4.2: Scope site configuration and public APIs
- **Requirements:** REQ-002, REQ-003
- **Design inputs:** Architecture decisions 2–3, 9
- **Description:** Scope site settings, themes, pages, sections, versions, announcements, inquiries, courts, events, and public APIs to the host-resolved club. Remove singleton/global uniqueness where tenant-local uniqueness is required.

#### Plan 4.3: Scope files, notifications, realtime, and jobs
- **Requirements:** REQ-002
- **Design inputs:** Architecture decision 2
- **Description:** Enforce tenant ownership for file reads/writes; namespace new uploads by club while preserving legacy files under the default club. Scope notifications, WebSocket channels, reports, audit events, and scheduled work to the owning club.

#### Plan 4.4: Scope site drafts, previews, and live versions
- **Requirements:** REQ-002, REQ-009
- **Design inputs:** Architecture decisions 2, 3, 6
- **Description:** Scope site settings, drafts, media, previews, review queues, history, deployment, and rollback to the resolved club. Approval records an approved version; a separate Super Admin deployment action makes it live.

#### Plan 4.5: Add direct cross-club messaging
- **Requirements:** REQ-002, REQ-012
- **Design inputs:** Architecture decisions 2, 3
- **Description:** Add one-to-one text conversations for active users of all roles across clubs. Require active participants and conversation membership on every operation; do not expose contact details or permit attachments. Notify recipients without leaking message contents into public channels.

### Phase 5 — Super Admin support, verification, and cutover

#### Plan 5.1: Add audited read-only support access
- **Requirements:** REQ-006
- **Design inputs:** Architecture decision 8
- **Description:** Add explicit read-only support endpoints and UI. Require a reason, create a time-limited support session, audit start/end and each access, prohibit write operations, and do not impersonate club users.

#### Plan 5.2: Verify tenant boundaries and production cutover
- **Requirements:** REQ-001 through REQ-007
- **Design inputs:** Architecture decisions 1–9
- **Description:** Add migration, two-club isolation, domain lifecycle, feature approval, support access, file, notification, WebSocket, and job tests. Run existing tests, compare pre/post migration counts, run foreign-key checks, and document DNS/TLS and backup/restore operations.

#### Plan 5.3: Gate subdomain publishing on approval and readiness
- **Requirements:** REQ-003, REQ-009, REQ-011
- **Design inputs:** Architecture decisions 3, 6, 9
- **Description:** Require a successful Super Admin approval before the separate deploy action. Verify distinct links resolve to the correct club and remain blocked when tenant isolation, wildcard DNS, HTTPS, or club activation is incomplete.

## Task Breakdown

### Phase 1 — Tenant model and migration
- [x] T001 [Plan:1.1] Add clubs, club_domains, and tenant ownership columns/constraints in `database/migrations/001_multiclub.js` and `database/schema.sql`. The JavaScript migration performs conditional SQLite table rebuilds so it can safely upgrade an existing schema or no-op on a fresh install.
- [x] T002 [Plan:1.1,1.2] Backfill current users, settings, feature state, site content, business rows, audit records, and upload metadata to the default club; add tenant-aware indexes and keys.
- [x] T003 [Plan:1.2] Add populated-legacy-database migration tests and assertions for row counts, foreign keys, uniqueness, and booking triggers in `server/src/shared/tests/`.

### Phase 2 — Custom domain and tenant authentication
- [x] T004 [Plan:2.1] Implement canonical host parsing and active club lookup in `server/src/shared/services/tenant.js`; resolve the `Host` header before API/static handling and validate WebSocket upgrades in `server/src/realtime/gateway.js`. Never trust `X-Forwarded-Host`; production ingress must preserve the canonical `Host`. Localhost is accepted only outside production; unknown, pending, insecure, and not-yet-enabled custom hosts fail closed.
- [x] T005 [Plan:2.2] Scope team/player account lookup, activation, OTP, and session authentication to `req.club` in `server/src/shared/services/authlogic.js`, `server/src/middleware/auth.js`, and `server/src/modules/auth/features/activation/service.js`; reject cross-club HTTP and WebSocket sessions.
- [x] T006 [Plan:2.3] Add DNS TXT challenge, domain verification/status endpoints, validation, and audit events under `server/src/modules/super-admin/features/domains/`.
- [x] T007 [Plan:2.3] Add Super Admin domain management UI and block tenant login/content until verification and manual HTTPS readiness confirmation.

### Phase 3 — Club provisioning and feature selection
- [ ] T008 [Plan:3.1] Extend Admin provisioning validation/service to atomically create the club, pending domain, feature state, Admin user, and profile in `server/src/modules/super-admin/features/admins/` and `server/src/shared/services/accounts.js`.
- [ ] T009 [Plan:3.2] Convert club feature state and feature-request persistence/APIs to tenant-aware keys and setup-time approve/decline decisions in `database/`, `server/src/shared/services/feature.js`, and Super Admin feature modules.
- [ ] T010 [Plan:3.1,3.2] Replace the Add Admin form with club/domain and requested-feature setup fields in `client/src/portals/super-admin/features/admins/pages/AdminsPage.jsx`.

### Phase 4 — Enforce tenant data isolation
- [ ] T011 [Plan:4.1,4.2] Scope account, settings, site, courts, inquiries, events, booking, payment, membership, tournament, player, and report queries to the trusted club context in `server/src/shared/services/`.
- [ ] T012 [Plan:4.1,4.2] Scope role feature services and guest/public API reads, writes, and ID-based operations in `server/src/modules/{admin,staff,coach-referee,player,guest}/`.
- [ ] T013 [Plan:4.3] Scope uploads/file access, notifications, realtime channels, audit events, and scheduled jobs to their owning club in `server/src/app.js`, `server/src/middleware/upload.js`, and `server/src/{shared/services,realtime,scripts}/`.
- [ ] T014 [Plan:4.1,4.2,4.3] Add two-club API tests covering cross-club IDs, list/search/export, public endpoints, child ownership, and every data family in `server/src/shared/tests/`.

### Phase 5 — Super Admin support, verification, and cutover
- [ ] T015 [Plan:5.1] Add reasoned, time-limited read-only support access with per-access audit logging and no impersonation in Super Admin routes, services, and UI.
- [ ] T016 [Plan:5.2] Add tests for custom-host normalization, pending/unverified domains, duplicate domains, per-club email identity, feature approval/isolation, support read-only behavior, and session host binding.
- [ ] T017 [Plan:5.2] Update `docs/` with tenant/domain contracts and operational backup, migration, DNS TXT, HTTPS readiness, and restore procedures; run the full `npm test` and client production build.
- [x] T018 [Plan:4.1] Allow Admins and Staff with `members_edit` permission to create active player accounts with a one-time temporary password and required first-login password change in `server/src/shared/services/accounts.js`, role feature services, and player creation UIs.
- [x] T019 [Plan:2.4] Generate a club subdomain from its slug using a required `CLUB_SUBDOMAIN_BASE_DOMAIN` setting and fail closed until wildcard routing/TLS readiness is confirmed.
- [ ] T020 [Plan:3.3] Add per-club Admin portal and public website feature selections to Super Admin provisioning; assign only approved features to each club.
- [x] T021 [Plan:4.4] Scope site drafts, versions, settings, media, previews, history, and review queues to the resolved club.
- [x] T022 [Plan:4.4,5.3] Split Super Admin approval from deployment; deploy only approved versions and keep an explicit approved-but-not-live state.
- [x] T023 [Plan:4.5] Add cross-club one-to-one message persistence and API with active-user lookup, membership checks, text-only validation, and recipient notifications.
- [x] T024 [Plan:4.5] Add a shared Chat page to every authenticated role portal with direct messaging and unread notifications.
- [ ] T025 [Plan:5.2,5.3] Verify two-club site isolation, feature gates, unique subdomains, approval-before-deploy, and cross-club conversation access; keep multi-club access disabled until all tenant isolation checks pass.

## Project Structure

```text
database/
  migrations/                 numbered tenant migration and backfill
server/src/
  middleware/                 trusted host resolution and tenant-aware auth
  modules/super-admin/        club/domain provisioning, feature decisions, support access
  shared/services/            tenant-scoped business services
  realtime/                   club-scoped channels
client/src/
  portals/super-admin/        pre-create club setup, domain status, read-only support
  shared/hooks/               resolved current-club feature state
docs/                         API, migration, DNS/TLS, and recovery procedures
```

## Testing Strategy

- **appType:** Mixed Express API + React SPA + WebSockets + scheduled jobs
- **Critical user journeys:** migrate the existing club; create a club/Admin with selected features; verify a custom domain and sign in; access tenant data and deny cross-club access; open audited read-only Super Admin support.
- **Primary validation stack:** Existing Node test runner, in-memory SQLite integration tests, Vite production build, and HTTP/WebSocket integration tests.
- **Fallback matrix:** database tier: in-memory SQLite tests plus copied-file migration test; browser tier: existing tests/build, with browser automation added only if already available.
- **Environment requirements:** Node.js >=20; no external DNS provider needed for code tests; actual domain/TLS verification requires a configured trusted ingress.
- **Test data strategy:** Two clubs with deliberately overlapping emails, duplicate local court numbers, and distinct rows across each business data family; keep the Super Admin global.
- **Acceptance criteria:** Unknown/pending/unverified hosts fail closed; club logins work only within the domain tenant; no club can read or mutate another club's records by list or guessed ID; only selected approved features are enabled for a new club; support access cannot mutate data and every session/access is audited; existing records remain available under the default club.
- **Validation review expectations:** Verify query scoping and parent ownership across every service, not only route/UI filtering; compare migration counts and run `PRAGMA foreign_key_check`; confirm custom domains through the actual proxy/TLS stack before production.

## Remaining external decisions

- Hosting ingress/provider and who configures DNS/TLS. The application plan is provider-neutral and assumes a trusted ingress plus HTTPS; domain activation remains blocked until both DNS ownership and HTTPS readiness are confirmed.
- Production display name and canonical host for the default club. Until supplied, migration will use a stable internal default-club ID and the existing deployment host.
- Production migration window and backup-retention period. The SQLite backup/restore procedure is required before cutover.
- The exact wildcard base domain is still required; the reply confirmed wildcard DNS/HTTPS capability but did not provide the hostname.
- No formal project constitution or feature-spec file exists. Requirements below are sourced from the user's confirmed decisions in this conversation.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|---|---|---|---|
| REQ-001 | Super Admin creates a separate club and Admin with setup completed before account creation | 1.1, 3.1 | `server/src/modules/super-admin/features/admins/`, `server/src/shared/services/accounts.js`, `client/src/portals/super-admin/features/admins/pages/AdminsPage.jsx` |
| REQ-002 | All club data and API access are isolated by resolved tenant | 2.1, 2.2, 4.1, 4.2, 4.3 | `server/src/middleware/`, `server/src/shared/services/`, `server/src/modules/`, `server/src/app.js` |
| REQ-003 | Custom domains require ownership verification and block login/content until active | 1.1, 2.1, 2.3, 4.2 | `database/migrations/`, `server/src/modules/super-admin/features/`, `server/src/app.js`, Super Admin domain UI |
| REQ-004 | Email/mobile account identity is unique within a club, not globally | 1.1, 2.2, 4.1 | tenant-aware user indexes, `server/src/shared/services/authlogic.js`, auth feature services |
| REQ-005 | Super Admin selects requested features and approves/declines requests during setup | 1.1, 3.1, 3.2 | tenant-aware `club_features`, feature-request service/routes, `AdminsPage.jsx` |
| REQ-006 | Super Admin support access is read-only, time-limited, reasoned, and audited | 5.1 | Super Admin support routes/services/UI and audit logs |
| REQ-007 | Existing application records remain with the default/current club | 1.1, 1.2, 5.2 | numbered SQL migration, migration tests, row-count and foreign-key verification |
| REQ-008 | Admins and authorized Staff can add active players using a temporary password that must be changed at first login | 4.1 | `server/src/shared/services/accounts.js`, Admin/Staff member services and player-creation UIs, `server/src/shared/tests/player-temp-password.test.js` |
| REQ-009 | Admins edit and preview drafts; Super Admin approval is separate from deployment | 2.3, 4.4, 5.3 | `server/src/shared/services/site.js`, Admin site designer, Super Admin deployments UI and routes |
| REQ-010 | Super Admin selects each club's approved Admin modules and public website features | 3.2, 3.3 | Super Admin Admin provisioning, `server/src/shared/services/feature.js`, Admin feature control, site designer |
| REQ-011 | Each club has a unique slug-based subdomain under a configured wildcard domain | 2.4, 5.3 | `server/src/config/env.js`, tenant host/domain services, club provisioning and domain UI |
| REQ-012 | Active users of all roles can direct-message active users across clubs using text-only chat and notifications | 4.3, 4.5, 5.2 | Chat API/persistence, shared chat portal, notification and realtime services |
