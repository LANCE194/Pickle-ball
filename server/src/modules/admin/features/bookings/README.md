# admin / bookings - Bookings

**Purpose:** Bookings for the admin role.
**Feature key:** core (always on)
**Roles:** admin, super_admin
**Tables used:** bookings

## Endpoints (mounted at `/api/admin/bookings`)
- `GET /api/admin/bookings` - roles: admin, super_admin
- `POST /api/admin/bookings/walk-in` - roles: admin, super_admin
- `POST /api/admin/bookings/recurring` - roles: admin, super_admin
- `PATCH /api/admin/bookings/:id/move` - roles: admin, super_admin
- `POST /api/admin/bookings/:id/cancel` - roles: admin, super_admin
- `GET /api/admin/bookings/slots` - roles: admin, super_admin

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
