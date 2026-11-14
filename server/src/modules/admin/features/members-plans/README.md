# admin / members-plans - Members and Plans

**Purpose:** Members and Plans for the admin role.
**Feature key:** memberships
**Roles:** admin, super_admin
**Tables used:** memberships, membership_plans, players

## Endpoints (mounted at `/api/admin/members-plans`)
- `GET /api/admin/members-plans/plans` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/plans` - roles: admin, super_admin - feature: memberships
- `PATCH /api/admin/members-plans/plans/:id` - roles: admin, super_admin - feature: memberships
- `GET /api/admin/members-plans/members` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/members` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/members/:playerId/renew` - roles: admin, super_admin - feature: memberships
- `GET /api/admin/members-plans/players` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/players` - roles: admin, super_admin - feature: memberships
- `GET /api/admin/members-plans/players/:id` - roles: admin, super_admin - feature: memberships
- `PATCH /api/admin/members-plans/players/:id` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/players/:id/resend-invite` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/players/:id/reset-password` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/players/:id/verify-level` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/players/:id/override-level` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/players/:id/archive` - roles: admin, super_admin - feature: memberships
- `POST /api/admin/members-plans/players/:id/restore` - roles: admin, super_admin - feature: memberships

## Notes
- Admins can add players and members. New player accounts are active, receive a one-time temporary password in the response, and must change it at first login. Membership payment status remains independent of player login status.
- The resend-invite endpoint remains for legacy invited player accounts.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
