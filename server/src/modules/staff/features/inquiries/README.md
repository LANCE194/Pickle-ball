# staff / inquiries - Inquiries

**Purpose:** Inquiries for the staff role.
**Feature key:** inquiries
**Roles:** staff
**Tables used:** inquiries

## Endpoints (mounted at `/api/staff/inquiries`)
- `GET /api/staff/inquiries` - roles: staff - feature: inquiries
- `POST /api/staff/inquiries/:id/handled` - roles: staff - feature: inquiries

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
