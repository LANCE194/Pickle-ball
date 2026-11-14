# super-admin / sessions - Sessions

**Purpose:** Sessions for the super admin role.
**Feature key:** core (always on)
**Roles:** super_admin
**Tables used:** sessions

## Endpoints (mounted at `/api/super-admin/sessions`)
- `GET /api/super-admin/sessions` - roles: super_admin
- `POST /api/super-admin/sessions/:id/revoke` - roles: super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
