# admin / reports - Reports

**Purpose:** Reports for the admin role.
**Feature key:** reports_dashboards
**Roles:** admin, super_admin
**Tables used:** bookings, payments

## Endpoints (mounted at `/api/admin/reports`)
- `GET /api/admin/reports/:period` - roles: admin, super_admin - feature: reports_dashboards
- `GET /api/admin/reports/:period/export.xlsx` - roles: admin, super_admin - feature: reports_dashboards
- `GET /api/admin/reports/:period/export.pdf` - roles: admin, super_admin - feature: reports_dashboards
- `GET /api/admin/reports/attendance.xlsx` - roles: admin, super_admin - feature: reports_dashboards

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
