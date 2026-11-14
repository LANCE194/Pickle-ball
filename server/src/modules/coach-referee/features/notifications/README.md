# coach-referee / notifications - Notifications

**Purpose:** Notifications for the coach referee role.
**Feature key:** core (always on)
**Roles:** coach_referee
**Tables used:** notifications

## Endpoints (mounted at `/api/coach-referee/notifications`)
- `GET /api/coach-referee/notifications` - roles: coach_referee
- `POST /api/coach-referee/notifications/read` - roles: coach_referee

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
