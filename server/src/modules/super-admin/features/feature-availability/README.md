# super-admin / feature-availability - Features

**Purpose:** Features for the super admin role.
**Feature key:** core (always on)
**Roles:** super_admin
**Tables used:** features, feature_requests

## Endpoints (mounted at `/api/super-admin/feature-availability`)
- `GET /api/super-admin/feature-availability` - roles: super_admin
- `PATCH /api/super-admin/feature-availability/:key` - roles: super_admin
- `GET /api/super-admin/feature-availability/requests` - roles: super_admin
- `PATCH /api/super-admin/feature-availability/requests/:id` - roles: super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
