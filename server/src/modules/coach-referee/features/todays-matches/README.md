# coach-referee / todays-matches - Today's Matches

**Purpose:** Today's Matches for the coach referee role.
**Feature key:** tournaments
**Roles:** coach_referee
**Tables used:** matches

## Endpoints (mounted at `/api/coach-referee/todays-matches`)
- `GET /api/coach-referee/todays-matches` - roles: coach_referee - feature: tournaments

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
