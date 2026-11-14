# player / membership - Membership

**Purpose:** Membership for the player role.
**Feature key:** memberships
**Roles:** player
**Tables used:** memberships

## Endpoints (mounted at `/api/player/membership`)
- `GET /api/player/membership` - roles: player - feature: memberships
- `GET /api/player/membership/plans` - roles: player - feature: memberships
- `POST /api/player/membership/join` - roles: player - feature: memberships

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
