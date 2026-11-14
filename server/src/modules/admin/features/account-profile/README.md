# admin / account-profile - My Profile

**Purpose:** Let an Admin update their own personal profile details and photo.
**Feature key:** core (always on)
**Roles:** admin
**Tables used:** staff_profiles, users

## Endpoints (mounted at `/api/admin/account-profile`)
- `GET /api/admin/account-profile` - roles: admin
- `PATCH /api/admin/account-profile` - roles: admin
- `POST /api/admin/account-profile/photo` - roles: admin

Admins can update their own name, birthdate, gender, address, and emergency contact. Login contact details, club details, and permissions remain managed through their existing account and club settings.
