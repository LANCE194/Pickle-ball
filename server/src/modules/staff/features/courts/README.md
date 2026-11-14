# staff / courts - Courts

**Purpose:** Courts for the staff role.
**Feature key:** core (always on)
**Roles:** staff
**Tables used:** courts

## Endpoints (mounted at `/api/staff/courts`)
- `GET /api/staff/courts` - roles: staff
- `PATCH /api/staff/courts/:id` - roles: staff

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
