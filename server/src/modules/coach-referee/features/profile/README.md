# coach-referee / profile - Profile

**Purpose:** Profile for the coach referee role.
**Feature key:** core (always on)
**Roles:** coach_referee
**Tables used:** referee_profiles

## Endpoints (mounted at `/api/coach-referee/profile`)
- `GET /api/coach-referee/profile` - roles: coach_referee
- `PATCH /api/coach-referee/profile` - roles: coach_referee
- `POST /api/coach-referee/profile/photo` - roles: coach_referee

## Notes
- Users can update their own personal details, specialization, and photo. Certification, role, and experience details remain managed by the club owner.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
