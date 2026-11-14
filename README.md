# DinkNest - Book. Play. Compete.

Pickleball court booking, player registration, tournaments, matchmaking, skill levels, role-based profiles and club member management.
Mobile-first web app (React + Vite + Tailwind) with an Express API, **one SQLite file as the database** (no database server to install), live updates over WebSocket, and optional PWA install. **One server process runs everything.**

Time zone **Asia/Manila**, currency **PHP**, English with a Filipino option for the main menu words.

## What is in the box
All 19 features of the spec are built in one project (no phases): authentication and closed registration, guest portal, courts, bookings and schedule (drag and drop, walk-in, weekly repeat), QR payments with proof and verification, role-based profiles and Elo-style player skill levels, tournaments (single elimination, double elimination, round robin, auto scheduling, live standings, printable bracket PDF), open play, memberships and check-in, staff and role management, events, notifications, dashboards and reports (PDF and Excel), audit log, Site Designer with Super Admin approval, Feature Control Center, and real-time data.

## Quick start (one install, one command)
Requirements: Node 20 or newer. Nothing else: no database server, no second terminal.

```bash
npm install
npm start
```
Open http://localhost:4000. On the first start the server creates the database file `data/dinknest.db`, builds the tables, adds the base data (roles, permissions, feature catalog, 3 courts) and builds the web app once. Everything (database, API, live updates, web app) runs in that single process on one port.

Optional, in a `.env` file (copy `.env.example`; none of it is required):
```bash
SUPER_ADMIN_EMAIL=you@example.com   # creates the Super Admin at start, password printed once
SEED_DEMO_DATA=true                 # development only: demo accounts for every role
```
- `npm run dev` same single server, with the web app reloading as you edit.
- Backups: use the Super Admin Backups screen to export a full `.dnbackup.gz` archive (database plus supported stored files) or restore one. A restore validates the archive and creates a pre-restore safety backup; it replaces the current system data and requires signing in again. Admins can export a club-only `.dnclub.gz` archive and send it to the Super Admin through chat; only the Super Admin can merge it back into that club. Keep backup files private and test recovery against an isolated copy before an emergency. For manual file copies, stop the server first and copy both `data/dinknest.db` and `data/storage`.
- Production: run `npm install`, `npm run build`, then `npm start` behind HTTPS (for example Caddy or nginx proxying one port, WebSocket path `/ws` included). A daily `npm run jobs` is an optional safety net (the server also runs its own timers).
- Moving to another machine: copy the project folder with `data/`. That is the whole system.

### Deploy to Vercel + Render

The client is already a Vite app. `vercel.json` builds and serves its SPA from `client/dist`; `render.yaml` deploys the Express API and WebSocket server with a persistent disk for the existing SQLite database and uploaded files. The Render service must use one instance because the SQLite file is local to that disk.

1. Push this project to a Git repository and import it into Vercel from the repository root. Set the project’s production domain so it stays stable. Vercel uses `npm run build` and `client/dist` from `vercel.json`.
2. Deploy the Render Blueprint from the same repository. The persistent disk requires a paid Render web service. Set these Blueprint environment values:
   - `DEFAULT_CLUB_HOSTS`: the exact Render API hostname, such as `dinknest-api.onrender.com`, with no scheme or path. This allows the API and WebSocket host to resolve the default club.
   - `CLIENT_ORIGIN`: the exact Vercel production origin, such as `https://dinknest.vercel.app`, with no trailing slash.
   - `SUPER_ADMIN_PATH`: a long, random private path.
   - `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_INITIAL_PASSWORD`: the initial Super Admin credentials. Set the password as a secret; change it at first login and enroll the authenticator.
   - Optional Twilio SMS: set `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and either `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`. Keep credentials only in Render environment variables. Twilio trial accounts have limited delivery and may send only to verified recipients; configure a paid Twilio account for unrestricted production delivery.
3. In Vercel’s Production Environment Variables, set `VITE_API_URL` to the Render API URL (for example `https://dinknest-api.onrender.com`, no trailing slash) and `VITE_SUPER_ADMIN_PATH` to the same value as Render’s `SUPER_ADMIN_PATH`. Redeploy Vercel after setting them; Vite embeds these values at build time.
4. Verify `https://<render-host>/api/health` returns `{"ok":true}`, then open the Vercel site and test sign-in, uploads, and chat. Use the Vercel production domain in `CLIENT_ORIGIN`; preview deployments use different origins and are not enabled by default.

The Render disk stores `/var/data/dinknest.db` and `/var/data/storage`, so deploys and restarts keep application data. Back up the database and storage before moving services or changing disk configuration.

### Super Admin bootstrap (pre-generated account)
There is **no screen, route or button** that can create a Super Admin. It is created by the server at start (or by `npm run create-super-admin`) from the environment:

```bash
SUPER_ADMIN_EMAIL=you@example.com npm start
```
- If `SUPER_ADMIN_INITIAL_PASSWORD` is empty, a random password is printed **once** in the terminal. It is stored only as a hash. Never put it in code, seeds, this README or logs.
- At the first login the Super Admin must **change the password** and **enrol an authenticator app (TOTP)** before anything else works.
- The login page lives at the path you set in `SUPER_ADMIN_PATH` (and `VITE_SUPER_ADMIN_PATH` in `client/.env`, then `npm run build`). It is reached only by the hidden trigger on the public footer. It is deliberately **not documented here**.

## Environment variables
| Variable | Purpose |
|---|---|
| PORT | the one port (default 4000) |
| DATABASE_FILE, STORAGE_DIR | SQLite file (default `data/dinknest.db`) and private picture storage (`data/storage`, served only through authenticated routes) |
| DEFAULT_CLUB_HOSTS | production hostnames that resolve to the default club; include the Render API hostname |
| CLIENT_ORIGIN | exact allowed browser origin when the frontend is hosted separately |
| SUPER_ADMIN_PATH | random secret path of the Super Admin entrance (server) |
| VITE_API_URL | API/WebSocket base URL for a separately deployed Vite frontend; blank for same-origin hosting |
| VITE_SUPER_ADMIN_PATH | same value as `SUPER_ADMIN_PATH`, set in the Vite build environment |
| SUPER_ADMIN_EMAIL, SUPER_ADMIN_INITIAL_PASSWORD | used only to create the Super Admin |
| SUPER_ADMIN_IP_ALLOWLIST | optional comma separated IPs allowed to reach the Super Admin entrance |
| SUPER_ADMIN_SECOND_FACTOR, TOTP_ISSUER | second factor settings (TOTP) |
| SEED_DEMO_DATA | `true` creates demo accounts (development only, refused in production) |
| SMTP_* , MAIL_FROM | email delivery; when empty, non-OTP emails are printed to the console |
| SMS_PROVIDER, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, TWILIO_MESSAGING_SERVICE_SID | optional Twilio SMS for player OTPs; SMS notifications also require the `sms_notifications` feature to be enabled |
| SKIP_BUILD, DEV | do not auto-build the web app / run in dev mode |

## Demo accounts (development only, `SEED_DEMO_DATA=true`)
Password for all: `Demo1234`

| Role | Login | Where |
|---|---|---|
| Admin (owner) | admin@dinknest.test | hidden Team Access (tap the logo 5 times, or the tiny dot in the footer) |
| Staff | staff@dinknest.test | Team Access |
| Coach / Referee | coach@dinknest.test | Team Access |
| Player | player1@dinknest.test or 09171000001 | Player Login |
| Player | player2@dinknest.test | Player Login |
| Invited player (no password yet) | invited@dinknest.test / 09171000003 | "First time here? Set up your account". In development, the mobile OTP is printed to the server console if Twilio is not configured; production requires a configured delivery channel. |

In production the only account that exists at the start is the pre-generated Super Admin.

## Account creation chain
Super Admin -> Admin -> Staff, Coach/Referee, Player. Enforced on the server and logged: an account can only be created by the role directly above it. No role can create its own level or higher. When creating an Admin, Staff, Coach/Referee or Player account, the creator sets its permanent password; the new account can sign in immediately. Password resets still follow the same role chain and issue a one-time password that must be changed at next login. Disabling or suspending an account revokes **all** its sessions at once.

Admins, Staff, Coaches/Referees and Players can update their own personal profile details and photo. Login contact details, permissions, and role-specific credentials remain managed through existing account and club controls. These profiles use the existing database tables; no new database or migration is required.

## Folder structure: role -> features
```
dinknest/
  database/            schema.sql (SQLite), seeds/001_base.sql, migrations/ (applied once, in order)
  data/                created at first start: dinknest.db and storage/ (your whole system)
  docs/                API.md, DATABASE.md, SCREENS.md, TRACEABILITY.md, TEST_CHECKLIST.md
  tools/               catalog.js (the structure), generate-features.js, generate-docs.js
  server/src/
    config/            env, db (SQLite layer), timezone
    middleware/        auth, requireRole, requireFeature, requirePermission, audit, rateLimit, upload, validate
    realtime/          gateway (role-scoped WebSocket channels)
    shared/            services (booking, payment, rating, bracket, notification, audit, feature, ...), utils, constants
    modules/
      loader.js        discovers every role folder and feature folder
      <role>/index.js  auto-loads features/*/index.js
      <role>/features/<feature-folder>/   index.js (manifest), routes.js, controller.js, service.js, validator.js, README.md, tests/
      roles: super-admin, admin, staff, coach-referee, player, guest, auth
  client/src/
    app/               router built from manifests, Portal (route guard + shell)
    shared/            components (Button, Card, StatusBadge, SlotGrid, Stepper, FormField, Drawer, ConfirmDialog, Toast, EmptyState, Skeleton, ErrorPanel, PageHeader, DataList, FileUpload, AppShell + desk/ composites), hooks (useClock, useRealtime, useFeature, useSession, useApi), lib, theme
    portals/<role>/features/<feature-folder>/   index.js (manifest), routes.js, pages/, components/, hooks/, api.js, constants.js, README.md, tests/
```
How the separation works: to change a feature edit only its folder; to add one create a folder with a manifest (it is found automatically, run `npm run generate` to scaffold the manifest, README and tests from `tools/catalog.js`); to remove one delete its folder. Menus, routes and the mobile tab bar are built from the manifests. A feature never imports another feature or another role: shared code lives in `shared/`. Each portal is a separate lazy-loaded bundle, so players never download admin or super-admin code.

## Flowchart
```
                          +---------------------------+
                          |  Public landing page      |
                          |  (live site design only)  |
                          +-------------+-------------+
                                        |
         +------------------------------+-------------------------------+
         | Login / Book Now / Join      | hidden footer trigger         | separate hidden trigger
         v                              v                               v
+------------------------+   +---------------------------+   +---------------------------+
| Player Login           |   | Team Access (/team-access)|   | Private Super Admin       |
| (+ First time? Set up  |   | admin, staff, coach only  |   | entrance (SUPER_ADMIN_PATH|
|  your account by code) |   +-------------+-------------+   | + authenticator code)     |
+-----------+------------+                 |                 +-------------+-------------+
            |                  +-----------+-----------+                   |
            v                  v           v           v                   v
   +----------------+   +-----------+ +---------+ +-----------+   +----------------------+
   | PLAYER FLOW    |   | ADMIN     | | STAFF   | | COACH /   |   | SUPER ADMIN FLOW     |
   | Home           |   | Dashboard | | Dashbd  | | REFEREE   |   | Admins, Deployments, |
   | Book (3 steps) |   | Bookings  | | Bookings| | Today's   |   | Features, Settings,  |
   | Pay + proof    |   | Payments  | | Payment | | matches   |   | Modules, Audit logs, |
   | My schedule    |   | Courts    | | queue   | | Score     |   | Sessions, Backups,   |
   | Find players   |   | Tournam.  | | Check-in| | entry     |   | Launch status        |
   | Tournaments    |   | Members   | | Matches | | Players   |   +----------------------+
   | Profile, level |   | Staff, QR | | Members | | Profile   |
   | Membership     |   | Reports   | | Events  | +-----------+
   |                |   |           | | Profile |
   +----------------+   | Site Des. | +---------+
                        | Features  |
                        | My Profile|
                        +-----------+
```
Booking money flow: Player books (held 30 min) -> pays by QR and sends proof (or Pay at the court) -> Staff or Admin approves -> booking confirmed + notification. A rejected proof can be re-sent.

## Roles and permission matrix (enforced on the server)
Y = yes, - = no

| Function | Super | Admin | Staff | Coach | Player | Guest |
|---|---|---|---|---|---|---|
| Update own profile | - | Y | Y | Y | Y | - |
| Create Admin accounts | Y | - | - | - | - | - |
| Create Staff and Coach accounts | - | Y | - | - | - | - |
| Add players and members | Y | Y | Y | - | - | - |
| Upload or change QR codes | Y | Y | - | - | - | - |
| Manage courts | Y | Y | edit only | - | - | view |
| Change prices | Y | Y | - | - | - | - |
| Walk-in bookings | Y | Y | Y | - | - | - |
| Book own court | - | - | - | - | Y | - |
| Verify payments | Y | Y | Y | - | - | - |
| Delete permanently | Y | archive/restore | archive only | - | own cancel | - |
| Create tournaments | Y | Y | draft | - | - | - |
| Enter match scores | Y | Y | Y | Y | - | - |
| Reports and analytics | Y | Y | daily only | - | - | - |
| Edit site design (draft) | Y | Y | - | - | - | - |
| Approve, deploy, roll back design | Y | - | - | - | - | - |
| Enable or disable available features | Y | Y | - | - | - | - |
| Make features available, lock, handle requests | Y | - | - | - | - | - |
| Submit a feature request | - | Y | - | - | - | - |
| Settings, audit logs, backups | Y | club settings only | - | - | - | - |

Staff permissions can be narrowed per person (bookings, payments, courts-edit, members-edit, events-post, matches-score, private details) from Staff management.

## Feature list and switches
Core (always on): sign-in and sessions, audit log, courts, bookings and schedule, in-app notifications. Notifications arrive in real time for the intended user or staff role; click a live alert or notification to open its related screen. Each user can turn the notification chime on or off from the notification drawer. Browsers may require an initial interaction before playing sound. Super Admins also receive in-app alerts for API request errors.
Optional (feature keys): guest_portal, recurring_bookings, qr_payments, pay_at_court, player_profiles_skill, tournaments, open_play, memberships, checkin_attendance, events_announcements, reports_dashboards, email_notifications, sms_notifications, site_designer, inquiries, realtime_updates.
Rules: tournaments and open_play need player_profiles_skill; at least one of qr_payments or pay_at_court must stay on; the Super Admin must make a feature available before the Admin can switch it on. Switching a feature off hides its menus for every role, answers 404 "Feature not available" on its routes, stops its jobs and keeps all its data.

## Docs
- `docs/API.md` all routes with roles and feature keys
- `docs/DATABASE.md` tables, enums and guarantees
- `docs/SCREENS.md` screens, usability scorecard and tap-count walkthroughs
- `docs/TEST_CHECKLIST.md` what to click on the first run
- `docs/TRACEABILITY.md` feature to code map

## Tests
`npm test` runs everything: unit tests (logic, manifests, no cross-feature imports), **integration tests using SQLite in memory** (booking races and double-booking, payments, memberships, tournaments of all three formats with scheduling and scores, open play, feature switches, Site Designer workflow, account chain), and the client folder checks.

## Known limits and remaining risks (please read)
1. **Browser verification is partial.** On 2026-11-14, all 273 tests passed and the Vite production build succeeded. The public landing page plus 10 Super Admin pages previously loaded in a browser without page errors. Feature-request workflow and other write-heavy business flows are covered by service integration tests using an isolated in-memory database; they were not submitted against the live database. Complete the role-by-role browser checks in `docs/TEST_CHECKLIST.md` against an isolated staging database before production sign-off.
2. **SQLite fits one club on one server.** It handles many readers and one writer at a time (fine for a club). If you ever need several servers, move to PostgreSQL. All SQL lives in the services and goes through `server/src/config/db.js`, which translates Postgres-style SQL to SQLite.
3. SMS is a stub (prints the code in the console). Email works when SMTP is set, otherwise it prints to the console.
4. Super Admin setup tokens are kept in memory (right for one process). The authenticator step shows the secret and the `otpauth://` link as text, not a QR image.
5. Double elimination needs 4, 8, 16 or 32 approved entries and has no bracket-reset final. Single elimination and round robin accept any size.
6. The Filipino option translates the shell (menu, help, a few buttons), not every sentence.
7. Recurring bookings are created up front for the number of weeks chosen (skipping weeks where the court is not free).
8. Rating uses a simple Elo formula (K = 0.10 on the 1.0 - 6.5 scale); tune it in `shared/services/rating.js`.
9. Run a security review of the private Super Admin entrance before real money or real data goes through it.
10. Search is case-insensitive for English letters only (SQLite).
