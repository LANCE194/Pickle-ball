# player / notifications - Notifications

**Purpose:** Notifications for the player role.
**Feature key:** core (always on)
**Roles:** player
**Tables used:** notifications

## Endpoints (mounted at `/api/player/notifications`)
- `GET /api/player/notifications` - roles: player
- `POST /api/player/notifications/read` - roles: player

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
