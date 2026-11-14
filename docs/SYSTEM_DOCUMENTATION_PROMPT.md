# Reusable Prompt: DinkNest System Documentation

Use the following prompt when regenerating or extending the system documentation. It instructs the writer to inspect the live repository before describing it and treats the implementation as the source of truth.

---

## Prompt

You are documenting the DinkNest pickleball club management system. Before writing, inspect the full repository and trace its real implementation. Do not rely on memory, old PDFs, README claims, or feature names alone. The code, current schema, configuration, tests, and generated route catalog are authoritative. Where prior documentation conflicts with the code, describe the code accurately and record the discrepancy.

### Required inspection

1. Read the root README, package manifests, environment example, startup/server files, Express application and middleware, React app/router, role and feature manifests, API catalog, database schema and migrations, shared services, realtime gateway, storage/email/SMS integrations, and test suites.
2. Read the current `docs/API.md`, `docs/DATABASE.md`, `docs/SCREENS.md`, `docs/TRACEABILITY.md`, and `docs/TEST_CHECKLIST.md`; verify important statements against source.
3. Inventory all implemented roles, role-specific screens, server feature modules, feature switches, core user journeys, key entities, API boundaries, security controls, and external services.
4. Record evidence and current verification boundaries. Do not say a workflow is fully functional merely because a route, screen, or test file exists. Distinguish automated test evidence, browser route rendering, workflow testing, and third-party delivery.
5. Do not make live database changes, expose credentials, invent secrets, or substitute another database. DinkNest uses its existing SQLite database; document that design as implemented.
6. If a source file or supplied PDF cannot be read, state that limitation and continue from verified repository sources. Do not claim to have reviewed inaccessible material.
7. For direct messaging, inspect the server role/club authorization, contact-directory query, client contact picker, and tests. Document the initiation matrix, reply behavior, club boundaries, result limits, and notification behavior from code.

### Deliverables

Create a clear, versioned Markdown system document for both technical and operational readers. Include:

- Purpose, audience, scope, system overview, and an implementation-based technology summary.
- Deployment/runtime topology, startup sequence, configuration, persistent storage, time zone and currency.
- Roles and access boundaries for Super Admin, Admin, Staff, Coach/Referee, Player, Guest, and authentication flows, including direct-message initiation permissions and contact-discovery boundaries.
- A feature catalog with core/optional status, role ownership, key dependencies, and evidence/status notes.
- End-to-end workflows, including booking/payment, account onboarding/password reset, feature requests and switches, site-design review/deployment, realtime notifications, and direct messaging with the searchable contact picker.
- API and WebSocket overview with authentication, authorization, error shape, and feature guards. Link to the generated API reference instead of copying every endpoint.
- Data model overview, entity relationships, integrity guarantees, file storage, backups, retention/soft-delete behavior where verified.
- Security/privacy boundaries, including message participant/role/club checks and contact data exposure, operational setup, environment variables, external service configuration, recovery/backups, and known limitations.
- Verification results with exact test/build/health outcomes and a clear list of untested flows. Never overstate validation.

### Three required diagrams

Include three different, readable diagrams:

1. **System architecture**: browser/client, HTTP API, role/feature middleware, business services, SQLite, file storage, WebSocket events, and optional SMTP/Twilio integrations.
2. **Core data relationships**: clubs, users and profiles, courts, bookings, payments, memberships, tournaments and results, notifications, chat, and site design. Show relationships and cardinality only when supported by the schema.
3. **End-to-end workflow**: show the player booking and payment lifecycle, including availability/price calculation, booking hold, proof review or pay-at-court, confirmation, notifications/realtime updates, and hold expiration path.

Use Mermaid `flowchart TD` or `flowchart LR` only. Keep labels short and ASCII-safe. Quote all edge labels, use valid named subgraphs, ensure node IDs are unique within each diagram, and close every subgraph. Place this exact attestation comment immediately before every Mermaid block:

`<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->`

### Accuracy and style

- Write in plain English, with technical details explained once and linked to source references.
- Use tables for role permissions, feature switches, configuration, and verification.
- Link to existing repository references using relative links.
- Label assumptions and gaps; omit unsupported claims.
- Do not silently remove, migrate, or redesign existing data architecture.
- Keep diagrams focused; put detail in tables and workflows rather than crowded node labels.
- Date the document and include the evidence sources used.

Before finishing, cross-check every role, feature, endpoint claim, entity relationship, workflow transition, and validation status against source. For chat, verify each direction in the role matrix, active-club scoping, contact result limits, and message limits against implementation and tests. List any remaining documentation or verification gaps explicitly.

---

## DinkNest-specific expected output

- Main document: `docs/SYSTEM_DOCUMENTATION.md`
- Generated API reference: `docs/API.md`
- Generated schema reference: `docs/DATABASE.md`
- Screen inventory and usability walkthroughs: `docs/SCREENS.md`
- Feature map: `docs/TRACEABILITY.md`
- Manual first-run checklist: `docs/TEST_CHECKLIST.md`

Regenerate the API/schema/screen/traceability references only with `npm run docs`; do not hand-edit those generated files.
