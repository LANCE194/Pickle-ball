# admin / inquiries - Inquiries

**Purpose:** Inquiries for the admin role.
**Feature key:** inquiries
**Roles:** admin, super_admin
**Tables used:** inquiries

## Endpoints (mounted at `/api/admin/inquiries`)
- `GET /api/admin/inquiries` - roles: admin, super_admin - feature: inquiries
- `POST /api/admin/inquiries/:id/handled` - roles: admin, super_admin - feature: inquiries

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
