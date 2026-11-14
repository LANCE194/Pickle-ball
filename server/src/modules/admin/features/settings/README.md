# admin / settings - Settings

**Purpose:** Settings for the admin role.
**Feature key:** core (always on)
**Roles:** admin, super_admin
**Tables used:** settings

## Endpoints (mounted at `/api/admin/settings`)
- `GET /api/admin/settings` - roles: admin, super_admin
- `PUT /api/admin/settings` - roles: admin, super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
