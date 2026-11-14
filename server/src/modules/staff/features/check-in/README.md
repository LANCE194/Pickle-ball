# staff / check-in - Check-in

**Purpose:** Check-in for the staff role.
**Feature key:** checkin_attendance
**Roles:** staff
**Tables used:** attendance

## Endpoints (mounted at `/api/staff/check-in`)
- `GET /api/staff/check-in` - roles: staff - feature: checkin_attendance
- `POST /api/staff/check-in` - roles: staff - feature: checkin_attendance
- `GET /api/staff/check-in/search` - roles: staff - feature: checkin_attendance

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
