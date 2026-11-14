# guest / player-login-activation - Player Login

**Purpose:** Player Login for the guest role.
**Feature key:** core (always on)
**Roles:** guest
**Tables used:** none

## Endpoints (mounted at `/api/guest/player-login-activation`)
- none (screens only)

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
