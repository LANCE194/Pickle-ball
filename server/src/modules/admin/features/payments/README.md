# admin / payments - Payments

**Purpose:** Payments for the admin role.
**Feature key:** core (always on)
**Roles:** admin, super_admin
**Tables used:** payments

## Endpoints (mounted at `/api/admin/payments`)
- `GET /api/admin/payments` - roles: admin, super_admin
- `POST /api/admin/payments/:id/approve` - roles: admin, super_admin
- `POST /api/admin/payments/:id/reject` - roles: admin, super_admin
- `GET /api/admin/payments/:id/proof` - roles: admin, super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
