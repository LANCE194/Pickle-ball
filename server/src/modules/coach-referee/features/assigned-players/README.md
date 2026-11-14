# coach-referee / assigned-players - Players

**Purpose:** Players for the coach referee role.
**Feature key:** player_profiles_skill
**Roles:** coach_referee
**Tables used:** players

## Endpoints (mounted at `/api/coach-referee/assigned-players`)
- `GET /api/coach-referee/assigned-players` - roles: coach_referee - feature: player_profiles_skill
- `POST /api/coach-referee/assigned-players/:id/verify-level` - roles: coach_referee - feature: player_profiles_skill

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
