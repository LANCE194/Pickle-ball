# admin / qr-settings - QR Settings

**Purpose:** QR Settings for the admin role.
**Feature key:** qr_payments
**Roles:** admin, super_admin
**Tables used:** payment_qr_codes

## Endpoints (mounted at `/api/admin/qr-settings`)
- `GET /api/admin/qr-settings` - roles: admin, super_admin - feature: qr_payments
- `POST /api/admin/qr-settings` - roles: admin, super_admin - feature: qr_payments
- `PATCH /api/admin/qr-settings/:id` - roles: admin, super_admin - feature: qr_payments
- `POST /api/admin/qr-settings/:id/toggle` - roles: admin, super_admin - feature: qr_payments
- `DELETE /api/admin/qr-settings/:id` - roles: admin, super_admin - feature: qr_payments

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
