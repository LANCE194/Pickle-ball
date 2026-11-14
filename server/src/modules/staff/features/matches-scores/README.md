# staff / matches-scores - Matches

**Purpose:** Matches for the staff role.
**Feature key:** tournaments
**Roles:** staff
**Tables used:** matches, match_scores

## Endpoints (mounted at `/api/staff/matches-scores`)
- `GET /api/staff/matches-scores` - roles: staff - feature: tournaments
- `POST /api/staff/matches-scores/:id/scores` - roles: staff - feature: tournaments

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
