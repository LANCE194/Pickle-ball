# staff / account-profile - My Profile

**Purpose:** Let Staff update their own personal profile details and photo.
**Feature key:** core (always on)
**Roles:** staff
**Tables used:** staff_profiles, users

## Endpoints (mounted at `/api/staff/account-profile`)
- `GET /api/staff/account-profile` - roles: staff
- `PATCH /api/staff/account-profile` - roles: staff
- `POST /api/staff/account-profile/photo` - roles: staff

Staff can update their own name, birthdate, gender, address, and emergency contact. Login contact details, job details, and permissions remain managed through their existing account and club settings.
