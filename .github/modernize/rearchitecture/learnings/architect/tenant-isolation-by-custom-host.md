# Tenant isolation by custom host

For a shared app with club-specific custom domains, derive tenant context from a verified host and enforce it through data, auth, features, files, events, and jobs.

## What Happened
In DinkNest task t1, source inspection found a single Express app serving the React SPA and API, global auth, singleton feature/settings/site state, and unscoped realtime and scheduled jobs. The multi-club plan recommends canonical host resolution at the trusted edge, a host-to-club registry, tenant-bound sessions, and fail-closed handling for unknown hosts. Existing rows must be backfilled to one default club. Identity sharing across clubs remains an explicit product decision.

## Takeaway
Do not treat tenant resolution as a route-prefix or UI concern. Resolve and bind the tenant before API/auth decisions, then scope every SQL operation and asynchronous side effect. Keep platform-wide catalog/control-plane data distinct from per-tenant state. Preserve old records through a default-club backfill and verify on a copied database before rollout.

## History
- 2026-11-12 (DinkNest/t1): initial
