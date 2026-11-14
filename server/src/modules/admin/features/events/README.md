# admin / events - Events

**Purpose:** Events for the admin role.
**Feature key:** events_announcements
**Roles:** admin, super_admin
**Tables used:** announcements

## Endpoints (mounted at `/api/admin/events`)
- `GET /api/admin/events` - roles: admin, super_admin - feature: events_announcements
- `POST /api/admin/events` - roles: admin, super_admin - feature: events_announcements
- `PATCH /api/admin/events/:id` - roles: admin, super_admin - feature: events_announcements
- `POST /api/admin/events/:id/image` - roles: admin, super_admin - feature: events_announcements
- `POST /api/admin/events/:id/archive` - roles: admin, super_admin - feature: events_announcements
- `POST /api/admin/events/:id/restore` - roles: admin, super_admin - feature: events_announcements

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
