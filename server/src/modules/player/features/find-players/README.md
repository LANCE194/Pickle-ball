# player / find-players - Find Players

**Purpose:** Find Players for the player role.
**Feature key:** open_play
**Roles:** player
**Tables used:** open_play_posts, open_play_members

## Endpoints (mounted at `/api/player/find-players`)
- `GET /api/player/find-players` - roles: player - feature: open_play
- `POST /api/player/find-players` - roles: player - feature: open_play
- `GET /api/player/find-players/suggestions` - roles: player - feature: open_play
- `POST /api/player/find-players/:id/join` - roles: player - feature: open_play
- `POST /api/player/find-players/:id/leave` - roles: player - feature: open_play
- `POST /api/player/find-players/:id/members/:playerId` - roles: player - feature: open_play
- `POST /api/player/find-players/:id/book` - roles: player - feature: open_play
- `POST /api/player/find-players/:id/cancel` - roles: player - feature: open_play

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
