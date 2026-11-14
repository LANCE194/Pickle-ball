# staff / players-members - Members

**Purpose:** Members for the staff role.
**Feature key:** core (always on)
**Roles:** staff
**Tables used:** players, users

## Endpoints (mounted at `/api/staff/players-members`)
- `GET /api/staff/players-members` - roles: staff
- `POST /api/staff/players-members` - roles: staff
- `GET /api/staff/players-members/:id` - roles: staff
- `PATCH /api/staff/players-members/:id` - roles: staff
- `POST /api/staff/players-members/:id/resend-invite` - roles: staff
- `POST /api/staff/players-members/:id/reset-password` - roles: staff
- `POST /api/staff/players-members/:id/verify-level` - roles: staff
- `POST /api/staff/players-members/:id/archive` - roles: staff

## Notes
- Staff with the `members_edit` permission can add players. New player accounts are active, receive a one-time temporary password in the response, and must change it at first login.
- The resend-invite endpoint remains for legacy invited player accounts.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
