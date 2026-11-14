# super-admin / deployments - Deployments

**Purpose:** Deployments for the super admin role.
**Feature key:** core (always on)
**Roles:** super_admin
**Tables used:** site_versions

## Endpoints (mounted at `/api/super-admin/deployments`)
- `GET /api/super-admin/deployments/queue` - roles: super_admin
- `GET /api/super-admin/deployments/history` - roles: super_admin
- `POST /api/super-admin/deployments/:id/approve` - roles: super_admin
- `POST /api/super-admin/deployments/:id/changes` - roles: super_admin
- `POST /api/super-admin/deployments/:id/reject` - roles: super_admin
- `POST /api/super-admin/deployments/:id/rollback` - roles: super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
