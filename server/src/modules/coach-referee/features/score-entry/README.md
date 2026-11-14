# coach-referee / score-entry - Score Entry

**Purpose:** Score Entry for the coach referee role.
**Feature key:** tournaments
**Roles:** coach_referee
**Tables used:** match_scores

## Endpoints (mounted at `/api/coach-referee/score-entry`)
- `POST /api/coach-referee/score-entry/:id` - roles: coach_referee - feature: tournaments

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
