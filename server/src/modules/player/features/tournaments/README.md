# player / tournaments - Tournaments

**Purpose:** Tournaments for the player role.
**Feature key:** tournaments
**Roles:** player
**Tables used:** tournaments, tournament_entries

## Endpoints (mounted at `/api/player/tournaments`)
- `GET /api/player/tournaments` - roles: player - feature: tournaments
- `GET /api/player/tournaments/:id` - roles: player - feature: tournaments
- `POST /api/player/tournaments/:id/register` - roles: player - feature: tournaments
- `POST /api/player/tournaments/entries/:entryId/withdraw` - roles: player - feature: tournaments
- `GET /api/player/tournaments/:id/matches` - roles: player - feature: tournaments
- `GET /api/player/tournaments/partners` - roles: player - feature: tournaments

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
