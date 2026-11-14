# admin / feature-control - Feature Control

**Purpose:** Feature Control for the admin role.
**Feature key:** core (always on)
**Roles:** admin, super_admin
**Tables used:** features, club_features, feature_requests

## Endpoints (mounted at `/api/admin/feature-control`)
- `GET /api/admin/feature-control` - roles: admin, super_admin
- `POST /api/admin/feature-control/:key` - roles: admin, super_admin
- `GET /api/admin/feature-control/requests` - roles: admin, super_admin
- `POST /api/admin/feature-control/requests` - roles: admin, super_admin
- `GET /api/admin/feature-control/wizard` - roles: admin, super_admin
- `POST /api/admin/feature-control/wizard` - roles: admin, super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
