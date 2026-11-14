# player / my-profile-level - My Profile and Level

**Purpose:** My Profile and Level for the player role.
**Feature key:** core (always on)
**Roles:** player
**Tables used:** players, rating_history

## Endpoints (mounted at `/api/player/my-profile-level`)
- `GET /api/player/my-profile-level` - roles: player
- `PATCH /api/player/my-profile-level` - roles: player
- `POST /api/player/my-profile-level/photo` - roles: player
- `GET /api/player/my-profile-level/history` - roles: player

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
