# staff / dashboard - Dashboard

**Purpose:** Dashboard for the staff role.
**Feature key:** reports_dashboards
**Roles:** staff
**Tables used:** bookings, payments

## Endpoints (mounted at `/api/staff/dashboard`)
- `GET /api/staff/dashboard` - roles: staff - feature: reports_dashboards

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
