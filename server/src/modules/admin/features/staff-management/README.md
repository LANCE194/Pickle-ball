# admin / staff-management - Staff

**Purpose:** Staff for the admin role.
**Feature key:** core (always on)
**Roles:** admin, super_admin
**Tables used:** users, staff_profiles, referee_profiles

## Endpoints (mounted at `/api/admin/staff-management`)
- `GET /api/admin/staff-management` - roles: admin, super_admin
- `POST /api/admin/staff-management` - roles: admin, super_admin
- `PATCH /api/admin/staff-management/:userId/permissions` - roles: admin, super_admin
- `POST /api/admin/staff-management/:userId/reset-password` - roles: admin, super_admin
- `POST /api/admin/staff-management/:userId/status` - roles: admin, super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
