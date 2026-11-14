# guest / public-tournaments - Tournaments

**Purpose:** Tournaments for the guest role.
**Feature key:** guest_portal
**Roles:** guest
**Tables used:** tournaments

## Endpoints (mounted at `/api/guest/public-tournaments`)
- `GET /api/guest/public-tournaments` - roles: guest - feature: guest_portal
- `GET /api/guest/public-tournaments/:id` - roles: guest - feature: guest_portal

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
