# super-admin / modules - Modules

**Purpose:** Modules for the super admin role.
**Feature key:** core (always on)
**Roles:** super_admin
**Tables used:** none

## Endpoints (mounted at `/api/super-admin/modules`)
- `GET /api/super-admin/modules` - roles: super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
