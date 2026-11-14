# auth / team-access - Team access

**Purpose:** Team access for the auth role.
**Feature key:** core (always on)
**Roles:** public
**Tables used:** users

## Endpoints (mounted at `/api/auth/team-access`)
- `POST /api/auth/team-access/login` - roles: public

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
