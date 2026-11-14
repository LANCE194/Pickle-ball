# auth / activation - Activation

**Purpose:** Activation for the auth role.
**Feature key:** core (always on)
**Roles:** public
**Tables used:** otp_codes

## Endpoints (mounted at `/api/auth/activation`)
- `POST /api/auth/activation/request` - roles: public
- `POST /api/auth/activation/verify` - roles: public

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
