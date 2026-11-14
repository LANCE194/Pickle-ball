# player / my-schedule - My Schedule

**Purpose:** My Schedule for the player role.
**Feature key:** core (always on)
**Roles:** player
**Tables used:** bookings

## Endpoints (mounted at `/api/player/my-schedule`)
- `GET /api/player/my-schedule` - roles: player
- `POST /api/player/my-schedule/:id/cancel` - roles: player

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
