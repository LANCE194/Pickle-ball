# DinkNest System Documentation

**Version:** 1.1  
**Reviewed:** 2026-11-14  
**System:** DinkNest pickleball club management  
**Source of truth:** Current repository implementation, schema, configuration, tests, and generated references.

## 1. Purpose and scope

DinkNest provides a public club website and authenticated portals for Super Admins, Admins, Staff, Coaches/Referees, and Players. It supports court booking and payments, member and player management, tournaments, open play, events, direct messaging, notifications, reporting, website publishing, and system administration.

This document describes the inspected implementation, not a proposed redesign. The application uses its existing SQLite data store. No database was changed while preparing this documentation.

## 2. System architecture

The application is a React single-page web client and Express API served from one Node.js process. The server mounts role-scoped feature modules, accesses SQLite through a shared query/transaction layer, serves uploaded files, and attaches an authenticated WebSocket gateway. SMTP and Twilio are optional integrations.

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart TD
    subgraph Users["User Interfaces"]
        Browser["Web browser and PWA"]
        React["React and Vite client"]
    end
    subgraph Server["Node.js application"]
        Express["Express HTTP API"]
        Middleware["Authentication and role guards"]
        Modules["Role and feature modules"]
        Services["Shared business services"]
        Chat["Role-checked chat service"]
        Notifications["Notification service"]
        Gateway["Authenticated WebSocket gateway"]
    end
    subgraph LocalData["Local persistent data"]
        SQLite[("Existing SQLite database")]
        Files[("Private and public file storage")]
    end
    subgraph External["Optional delivery services"]
        SMTP["SMTP email"]
        Twilio["Twilio SMS"]
    end

    Browser -->|"renders"| React
    React -->|"HTTP requests"| Express
    Express -->|"passes requests through"| Middleware
    Middleware -->|"routes authorized calls"| Modules
    Modules -->|"uses"| Services
    Services -->|"queries and transactions"| SQLite
    Services -->|"reads and writes uploads"| Files
    Modules -->|"routes chat requests"| Chat
    Chat -->|"uses shared data services"| Services
    Chat -->|"notifies the recipient"| Notifications
    Notifications -->|"publishes scoped events"| Gateway
    React -->|"authenticated live connection"| Gateway
    Gateway -->|"publishes role and user events"| React
    Services -->|"optional email delivery"| SMTP
    Services -->|"optional SMS delivery"| Twilio
~~~

### Technology summary

| Layer | Technology | Purpose |
|---|---|---|
| Client | React 18, Vite, Tailwind CSS | Role-specific SPA, responsive screens, production build |
| Server | Node.js, Express | HTTP API, static client hosting, authentication and route mounting |
| Data | SQLite via `better-sqlite3` with Node SQLite fallback | Existing single-file relational store and transactions |
| Realtime | WebSocket (`ws`) | Authenticated per-user, per-role, staff, and public event channels |
| Files | Local storage directory | Uploaded payment proofs, QR images, profiles, court/site media |
| Email | Nodemailer and configured SMTP | Optional email notifications and account codes |
| SMS | Twilio REST API | Optional SMS OTP and notifications |

### Runtime and data boundaries

`npm start` starts the server, runs schema migrations, ensures base site data, optionally seeds development demo accounts, optionally creates the Super Admin when configured, attaches the WebSocket server, and serves the client. The default database path is `data/dinknest.db`; uploads are stored under `data/storage`. The project is designed for one server process and one SQLite file. Times are stored in UTC and displayed in Asia/Manila; currency is Philippine pesos.

The application includes multi-club data fields and domain-resolution code, but multi-club mode is disabled by default and must not be presented as production-ready until its configuration and isolation are enabled and verified.

### Architectural decisions

- Role and feature manifests drive client navigation and server module registration.
- Services centralize business rules and use a shared SQL compatibility layer and transaction helper.
- SQLite is the system database; no external database server is required.
- Realtime messages are scoped to authenticated users/roles or explicitly public channels. Private notifications are not broadcast to every user.

## 3. Roles and access model

| Role | Main responsibilities | Portal |
|---|---|---|
| Super Admin | Create/manage Admin accounts, system settings, feature availability, site deployment review, audit, sessions, backups, domains, and Admin messages | Private Super Admin portal |
| Admin | Manage club operations, staff and players, bookings, payments, courts, memberships, tournaments, events, site drafts, feature requests, and club messages | Admin portal |
| Staff | Front-desk bookings, payment review, court updates, members, check-in, events, matches, inquiries, and messages subject to configured permissions | Staff portal |
| Coach / Referee | Assigned player-level verification, match schedules and scoring, profile, notifications, and messages | Coach/Referee portal |
| Player | Bookings, payments, profile, events, open play, tournaments, membership, notifications, and messages | Player portal |
| Guest | Public site, rates, availability, public events/tournaments and inquiries | Guest portal |

Access is enforced on the server as well as by client routing. Authenticated requests carry a bearer token. Each browser tab has its own session. The Super Admin entrance is configured with `SUPER_ADMIN_PATH`; Super Admin setup supports a password step and TOTP based on configuration.

### Direct-message permissions

The `chat_messages` feature enables one-to-one messaging for active signed-in users. The server enforces the initiation matrix and active-club boundaries; the contact picker does not grant access by itself.

| Sender role | May start a conversation with |
|---|---|
| Super Admin | Admins across active clubs |
| Admin | Super Admin, Staff, Players, and Coach/Referees in the same active club |
| Staff | Admin, Players, and Coach/Referees in the same active club |
| Player | Staff and Coach/Referees in the same active club |
| Coach / Referee | Admin and Staff in the same active club |

A recipient can reply in an existing conversation. Super Admins can contact Admins across clubs; all other eligible contacts must belong to the sender's active club. Guests cannot use chat.

## 4. Feature catalog

The repository traceability matrix documents these 19 feature areas. “Core” means the feature is not controlled by an optional feature switch; it does not mean that every workflow was browser-tested.

| Feature area | Principal users | Core or switch-controlled |
|---|---|---|
| Authentication and access | All roles | Core |
| Guest portal | Guest | `guest_portal` |
| Court management | Admin, Staff | Core |
| Booking and schedule | Player, Admin, Staff | Core |
| QR payments | Player, Admin, Staff | `qr_payments`; pay-at-court has a separate switch |
| Player profile and skill level | Player, Admin, Staff, Coach/Referee | `player_profiles_skill` for related capabilities |
| Tournaments and scoring | Player, Admin, Staff, Coach/Referee, Guest | `tournaments` |
| Open play | Player | `open_play` |
| Memberships and check-in | Player, Admin, Staff | `memberships`, `checkin_attendance` |
| Staff and role management | Super Admin, Admin | Core |
| Events and announcements | Admin, Staff, Player, Guest | `events_announcements` |
| Notifications | All signed-in roles | Core |
| Reports and dashboards | Admin, Staff | `reports_dashboards` |
| Audit and security | Super Admin | Core |
| Site Designer and deployment | Admin, Super Admin, Guest | `site_designer` |
| Feature Control Center | Admin, Super Admin | Core |
| Realtime updates | All applicable roles and public availability | `realtime_updates` |
| Inquiries | Guest, Admin, Staff | `inquiries` |
| Direct messages and searchable contact picker | Eligible signed-in users | `chat_messages` |

Dependencies and route ownership are maintained in [TRACEABILITY.md](./TRACEABILITY.md) and [API.md](./API.md). Optional feature switches can hide client menus and guard server routes; the Super Admin controls feature availability and the Admin controls club-level enablement.

### Club identity, visual theme, and approval

The public site identifies DinkNest as a welcoming home court: “dink” refers to pickleball's soft game and “nest” to a home where players connect, play, and grow. Each club can edit its own public display name and its meaning in Site Designer. The existing palette remains court green, volt lime, navy, blue, clay, and off-white, with coordinated light and dark modes. Club identity edits stay in draft until the Admin submits them and the Super Admin approves and deploys the site version. The public homepage then shows that club's name and meaning.

The shared interface uses reduced-motion-aware transitions and entrance, hover, notification, and loading animations. Visitors can switch between light and dark modes on the public site; signed-in users retain the existing preference toggle.

## 5. End-to-end workflows

### 5.1 Player booking and payment

1. The player selects a date, court, and available time.
2. The server returns the public-safe availability grid and calculates the quote from configured rates and any eligible membership discount.
3. The server validates court hours, blocks, and current bookings. A database trigger prevents overlapping active bookings.
4. A pending booking receives a configurable hold expiration time.
5. The player submits payment proof using an enabled QR method, or chooses pay-at-court when enabled.
6. Staff/Admin review the payment. Approval updates the payment and confirms the booking; rejection stores a reason and allows the player to submit new proof.
7. Availability and staff queues are updated through WebSocket events. Relevant users receive in-app notifications; email/SMS delivery is optional.
8. If no qualifying payment is received before the hold expires, the background job expires the booking and publishes an availability update.

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart TD
    Start["Player chooses date and court"]
    Quote["Server calculates price and membership discount"]
    Check["Validate hours, blocks, and availability"]
    Hold["Create pending booking with hold expiry"]
    Pay["Payment route"]
    Proof["Player sends payment proof"]
    Venue["Player selects pay at court"]
    Review["Staff or Admin reviews payment"]
    Decision["Payment approved"]
    Confirm["Confirm booking and payment"]
    Reject["Reject with reason"]
    Retry["Player may resubmit proof"]
    Expire["Background job expires unpaid hold"]
    Live["Publish availability and notify recipients"]
    End["Player sees current booking status"]

    Start -->|"requests quote"| Quote
    Quote -->|"submits booking"| Check
    Check -->|"available"| Hold
    Hold -->|"choose payment"| Pay
    Pay -->|"QR payment"| Proof
    Pay -->|"at venue"| Venue
    Proof -->|"queued for review"| Review
    Venue -->|"queued for review"| Review
    Review -->|"review result"| Decision
    Decision -->|"yes"| Confirm
    Decision -->|"no"| Reject
    Reject -->|"correct and retry"| Retry
    Retry -->|"new proof"| Proof
    Confirm -->|"publish changes"| Live
    Reject -->|"send update"| Live
    Hold -->|"no payment before expiry"| Expire
    Expire -->|"release slot"| Live
    Live -->|"refresh status"| End
~~~

### 5.2 Account onboarding and password recovery

- Super Admin creates Admin accounts. Admin creates Staff/Coach accounts and can create Player accounts through the appropriate workflow.
- Account creators set a permanent password when creating Admin, Staff/Coach, or Player accounts. Accounts created this way are active and do not receive a temporary password.
- Invited-player activation uses the activation contact/code/password flow.
- Password reset remains a separate one-time temporary-password flow and requires the user to replace that password at next login.
- Account status changes and session revocation are enforced by the server.

### 5.3 Feature request and availability

1. An Admin submits a feature request.
2. The Super Admin reviews it and updates its status.
3. The Super Admin makes a feature available or locked as appropriate.
4. The Admin enables or disables the available feature for the club, subject to declared dependencies.
5. The client updates navigation in realtime; server feature guards enforce the switch and preserve feature data.

### 5.4 Site design review and publication

1. Admin edits and previews a draft site design.
2. Admin submits the draft for review.
3. Super Admin reviews the submitted design and approves, requests changes, or rejects it.
4. Approved designs can be deployed; the Super Admin can roll back to an earlier version.
5. The public site reads the live configuration, while launch status can display a Coming Soon state.

### 5.5 Realtime notifications

Notifications are persisted for an individual recipient and published to that user’s WebSocket channel. The app shows a clickable live alert, supports a per-user chime preference, and routes known kinds to a relevant screen when that screen is available. The notification drawer is the fallback. Super Admins receive in-app API error alerts for 4xx and 5xx responses; repeated same-route errors are grouped. These error alerts are in-app only.

### 5.6 Direct messages and contact discovery

1. An active signed-in user opens Messages while `chat_messages` is enabled.
2. The page loads eligible active contacts automatically. The role dropdown filters that list; name search requests matching contacts from the server. The default directory returns at most 50 contacts and a search returns at most 25. Contact results expose an ID, display name, role, and club name, not email or mobile number.
3. Selecting a contact opens or reuses the pair's one-to-one conversation. The server validates the role pairing and club boundary when creating a conversation and again when listing conversations, reading messages, or sending.
4. Users send plain-text messages of 1 to 2,000 characters. Reading a conversation returns up to the latest 100 messages and updates its read marker.
5. The recipient receives a persisted in-app notification that identifies the sender without including message text. Chat operations use the HTTP API; notifications may also be delivered through the authenticated realtime notification channel.

The regular message composer does not send arbitrary files. The separate Admin-to-Super-Admin club backup handoff supports `.dnclub.gz` attachments, as described in [Backup and emergency recovery](#backup-and-emergency-recovery).

## 6. Data model

The schema is SQLite with foreign keys enabled, ISO timestamp text, CHECK constraints for enumerated states, integer booleans, and JSON stored as text. It uses soft deletion/archive timestamps where defined. Database-specific guarantees include the single-Super-Admin unique index and booking-overlap triggers.

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart LR
    Club[("Club")]
    User[("User")]
    Player[("Player profile")]
    Staff[("Staff profile")]
    CoachProfile[("Coach referee profile")]
    Court[("Court")]
    Booking[("Booking")]
    Payment[("Payment")]
    Plan[("Membership plan")]
    Membership[("Membership")]
    Tournament[("Tournament")]
    Entry[("Tournament entry")]
    Match[("Match")]
    Score[("Match score")]
    Notification[("Notification")]
    Conversation[("Chat conversation")]
    Message[("Chat message")]
    SiteVersion[("Site version")]
    Media[("Media asset")]

    Club -->|"has club scoped users"| User
    User -->|"may own"| Player
    User -->|"may own"| Staff
    User -->|"may own"| CoachProfile
    Player -->|"makes"| Booking
    Court -->|"scheduled for"| Booking
    Booking -->|"may have"| Payment
    Entry -->|"may have payment"| Payment
    Membership -->|"may have payment"| Payment
    Player -->|"subscribes to"| Membership
    Plan -->|"defines"| Membership
    Tournament -->|"contains"| Entry
    Player -->|"enters"| Entry
    Entry -->|"competes in"| Match
    Match -->|"has scores"| Score
    User -->|"receives"| Notification
    User -->|"participates in"| Conversation
    Conversation -->|"contains"| Message
    User -->|"sends"| Message
    Club -->|"publishes"| SiteVersion
    Club -->|"owns"| Media
~~~

The diagram is a core-entity overview, not an exhaustive schema. See [DATABASE.md](./DATABASE.md) for table/state details and the actual `database/schema.sql` for authoritative columns and constraints. A payment may be associated with a booking, tournament entry, or membership. Tournament entries and matches track competition progression. Site versions and media support draft, review, deployment, and rollback.

Chat uses two-participant conversations, participant read markers, and messages stored in SQLite. See the message authorization and active-club boundaries in [Direct-message permissions](#direct-message-permissions).

## 7. API, realtime, and integrations

- HTTP routes are rooted at `/api`; endpoint methods, roles, and feature keys are listed in [API.md](./API.md).
- Authenticated requests use `Authorization: Bearer <token>`. Error responses use a friendly error message and optional code/field information.
- Direct-message endpoints include `GET /api/chat/messages/users` (eligible contacts, with optional name search), `GET` and `POST /api/chat/messages/conversations`, and `GET` and `POST /api/chat/messages/conversations/:id/messages`. Contact lookup is limited to 50 results without a search and 25 with one; message reads return up to 100. See [API.md](./API.md) and the [chat API notes](../server/src/modules/chat/features/messages/README.md) for endpoint details.
- WebSockets connect at `/ws?token=...`. Channels include public availability, global feature changes, a user’s own events, role events, staff-side updates, and scores. The gateway checks subscriptions against the authenticated role.
- Core in-app notifications are stored in SQLite. Optional email uses SMTP through Nodemailer. Optional SMS uses Twilio and the `sms_notifications` feature switch.
- Browser notification sound is synthesized with Web Audio after a user gesture and can be disabled per user. Browser autoplay policies can prevent sound before the user interacts with the app.

## 8. Configuration and operation

Copy `.env.example` to `.env` as needed. Important settings include:

| Setting | Purpose |
|---|---|
| `PORT`, `DATABASE_FILE`, `STORAGE_DIR`, `TZ` | Runtime port, existing SQLite file, uploads, display time zone |
| `SUPER_ADMIN_PATH`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_SECOND_FACTOR` | Private Super Admin entry and bootstrap/security behavior |
| `DEFAULT_CLUB_HOSTS`, `MULTICLUB_ENABLED`, domain settings | Tenant host resolution; multi-club is disabled by default |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Optional email delivery |
| `SMS_PROVIDER`, `TWILIO_*` | Optional Twilio SMS delivery |
| `SEED_DEMO_DATA` | Development-only demo accounts |

Typical local setup is `npm install`, `npm start`, then open `http://localhost:4000`. `npm run build` creates the production client bundle.

### Backup and emergency recovery

- **Full-system recovery:** A Super Admin exports a `.dnbackup.gz` archive from the Backups screen. It contains a consistent SQLite snapshot and supported stored files. Only Super Admins can import it. The import validates the archive, creates a safety archive of the current data, replaces the database and included files, and requires the Super Admin to authenticate again. Do not start a full restore casually; it replaces the current system state.
- **Club handoff:** An Admin exports a `.dnclub.gz` archive limited to their club and can send it directly to the active Super Admin through chat. The Super Admin may download the attachment or use the chat restore action to merge it into the club recorded in the archive. Other clubs are not replaced, and repeat imports of the same package are rejected.
- Keep backup archives private and outside public repositories. Retain a separate copy from the running server, protect access to it, and perform a restore drill on an isolated copy before depending on it for emergencies. Full upload size is capped at 512 MiB.
- Manual file backups require the server to be stopped and both the SQLite database file and `data/storage` to be copied together. See [API.md](./API.md) for endpoint details.

## 9. Security, privacy, and integrity

- Passwords are hashed; sessions are represented by token hashes in storage.
- Role checks and optional feature checks are enforced at server routes.
- Chat verifies active users, conversation participation, allowed role pairings, and active-club boundaries on the server. The contact directory returns only display name, role, club name, and ID; it does not expose email addresses or mobile numbers.
- Private file routes validate user/role and, for selected content, ownership.
- User and role-specific WebSocket messages are not broadcast indiscriminately.
- The Super Admin account is constrained to one by a partial unique index. Optional Super Admin IP allowlist and TOTP settings are configurable.
- Booking-overlap triggers provide a database-level defense against double booking.
- Keep `.env`, SMTP/Twilio credentials, private uploads, database files, and generated backups out of public repositories.

## 10. Verification status and known gaps

| Check | Result | Boundary |
|---|---|---|
| Automated suite | 280 passed, 0 failed, 0 skipped (latest full-suite run); focused chat tests: 2 passed | Includes role/club authorization, contact directory, and chat route checks; integration uses temporary or in-memory SQLite |
| Production build | Passed | Build validates client compilation/bundling, not user journeys |
| Health | `/api/health` returned HTTP 200 | Does not prove every endpoint or integration works |
| Browser routes | 11 Super Admin sidebar screens loaded with HTTP 200 and no uncaught page errors | Other role portals and write workflows were not browser-tested |
| Email/SMS | Not tested with external provider credentials | Requires configured SMTP/Twilio accounts |
| Live database | Not changed during this documentation review | Staging write workflows remain necessary |
| Supplied PDF | Browser attachment was visible but its text was not extractable in this review | This document uses repository implementation and generated docs as evidence |

Do not treat “feature is present” or a route returning a page as proof that all business behavior is production-ready. Complete [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) against isolated staging data, especially role-specific account access, booking/payment writes, tournament competition workflows, website approval, chat and notifications across roles, mobile layout, and external delivery.

## 11. Source references

- [Project README](../README.md)
- [API route reference](./API.md)
- [Database table reference](./DATABASE.md)
- [Feature traceability](./TRACEABILITY.md)
- [Screen inventory and task walkthroughs](./SCREENS.md)
- [First-run test checklist](./TEST_CHECKLIST.md)
- [Reusable documentation prompt](./SYSTEM_DOCUMENTATION_PROMPT.md)
- [Detailed architecture and component diagrams](../.github/modernize/assessment/engines/facts/architecture-diagram.md)
- `server/src/server.js`, `server/src/app.js`, `server/src/modules/loader.js`
- `server/src/config/db.js`, `database/schema.sql`
- `server/src/realtime/gateway.js`, `server/src/shared/services/notification.js`
- `server/src/modules/chat/features/messages/service.js`, `server/src/modules/chat/features/messages/controller.js`
- `client/src/portals/shared/features/chat/pages/ChatPage.jsx`
- `server/src/shared/tests/chat.test.js`, `client/src/portals/shared/features/chat/tests/chat.test.js`
- `client/src/app/App.jsx`, `client/src/app/Portal.jsx`
