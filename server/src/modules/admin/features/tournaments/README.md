# admin / tournaments - Tournaments

**Purpose:** Tournaments for the admin role.
**Feature key:** tournaments
**Roles:** admin, super_admin
**Tables used:** tournaments, tournament_entries, matches

## Endpoints (mounted at `/api/admin/tournaments`)
- `GET /api/admin/tournaments` - roles: admin, super_admin - feature: tournaments
- `POST /api/admin/tournaments` - roles: admin, super_admin - feature: tournaments
- `PATCH /api/admin/tournaments/:id` - roles: admin, super_admin - feature: tournaments
- `POST /api/admin/tournaments/:id/status` - roles: admin, super_admin - feature: tournaments
- `GET /api/admin/tournaments/:id/entries` - roles: admin, super_admin - feature: tournaments
- `POST /api/admin/tournaments/entries/:entryId/decision` - roles: admin, super_admin - feature: tournaments
- `POST /api/admin/tournaments/:id/generate` - roles: admin, super_admin - feature: tournaments
- `GET /api/admin/tournaments/:id/matches` - roles: admin, super_admin - feature: tournaments
- `GET /api/admin/tournaments/:id/bracket.pdf` - roles: admin, super_admin - feature: tournaments

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
