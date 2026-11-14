# super-admin / admins - Admins

**Purpose:** Admins for the super admin role.
**Feature key:** core (always on)
**Roles:** super_admin
**Tables used:** users, staff_profiles

## Endpoints (mounted at `/api/super-admin/admins`)
- `GET /api/super-admin/admins` - roles: super_admin
- `POST /api/super-admin/admins` - roles: super_admin
- `POST /api/super-admin/admins/:id/reset-password` - roles: super_admin
- `POST /api/super-admin/admins/:id/status` - roles: super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
