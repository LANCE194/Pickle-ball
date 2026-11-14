# auth / player-login - Player login

**Purpose:** Player login for the auth role.
**Feature key:** core (always on)
**Roles:** public
**Tables used:** users, sessions

## Endpoints (mounted at `/api/auth/player-login`)
- `POST /api/auth/player-login/login` - roles: public
- `POST /api/auth/player-login/forgot` - roles: public
- `POST /api/auth/player-login/reset` - roles: public

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
