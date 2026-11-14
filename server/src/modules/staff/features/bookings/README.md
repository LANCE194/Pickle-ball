# staff / bookings - Bookings

**Purpose:** Bookings for the staff role.
**Feature key:** core (always on)
**Roles:** staff
**Tables used:** bookings

## Endpoints (mounted at `/api/staff/bookings`)
- `GET /api/staff/bookings` - roles: staff
- `POST /api/staff/bookings/walk-in` - roles: staff
- `POST /api/staff/bookings/recurring` - roles: staff
- `PATCH /api/staff/bookings/:id/move` - roles: staff
- `POST /api/staff/bookings/:id/cancel` - roles: staff
- `GET /api/staff/bookings/slots` - roles: staff

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
