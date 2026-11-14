# staff / events - Events

**Purpose:** Events for the staff role.
**Feature key:** events_announcements
**Roles:** staff
**Tables used:** announcements

## Endpoints (mounted at `/api/staff/events`)
- `GET /api/staff/events` - roles: staff - feature: events_announcements
- `POST /api/staff/events` - roles: staff - feature: events_announcements
- `PATCH /api/staff/events/:id` - roles: staff - feature: events_announcements

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
