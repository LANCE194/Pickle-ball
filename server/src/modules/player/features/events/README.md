# player / events - Events

**Purpose:** Events for the player role.
**Feature key:** events_announcements
**Roles:** player
**Tables used:** announcements

## Endpoints (mounted at `/api/player/events`)
- `GET /api/player/events` - roles: player - feature: events_announcements

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
