# admin / courts-rates - Courts and Rates

**Purpose:** Courts and Rates for the admin role.
**Feature key:** core (always on)
**Roles:** admin, super_admin
**Tables used:** courts, court_blocks

## Endpoints (mounted at `/api/admin/courts-rates`)
- `GET /api/admin/courts-rates` - roles: admin, super_admin
- `POST /api/admin/courts-rates` - roles: admin, super_admin
- `PATCH /api/admin/courts-rates/:id` - roles: admin, super_admin
- `POST /api/admin/courts-rates/:id/photo` - roles: admin, super_admin
- `POST /api/admin/courts-rates/:id/archive` - roles: admin, super_admin
- `POST /api/admin/courts-rates/:id/restore` - roles: admin, super_admin
- `GET /api/admin/courts-rates/blocks` - roles: admin, super_admin
- `POST /api/admin/courts-rates/:id/blocks` - roles: admin, super_admin
- `DELETE /api/admin/courts-rates/blocks/:blockId` - roles: admin, super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
