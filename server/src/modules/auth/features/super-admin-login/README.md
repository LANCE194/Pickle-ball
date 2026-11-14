# auth / super-admin-login - Super Admin login

**Purpose:** Super Admin login for the auth role. The authenticator requirement is controlled by `SUPER_ADMIN_SECOND_FACTOR` (`totp` by default, or `none`).
**Feature key:** core (always on)
**Roles:** public
**Tables used:** users

## Endpoints (mounted at `/api/auth/super-admin-login`)
- `POST /api/auth/super-admin-login/login` - roles: public
- `POST /api/auth/super-admin-login/setup/password` - roles: public
- `POST /api/auth/super-admin-login/setup/totp` - roles: public
- `POST /api/auth/super-admin-login/setup/totp/confirm` - roles: public

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
