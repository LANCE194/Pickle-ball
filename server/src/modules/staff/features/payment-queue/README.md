# staff / payment-queue - Payment Queue

**Purpose:** Payment Queue for the staff role.
**Feature key:** core (always on)
**Roles:** staff
**Tables used:** payments

## Endpoints (mounted at `/api/staff/payment-queue`)
- `GET /api/staff/payment-queue` - roles: staff
- `POST /api/staff/payment-queue/:id/approve` - roles: staff
- `POST /api/staff/payment-queue/:id/reject` - roles: staff
- `POST /api/staff/payment-queue/:id/paid-at-court` - roles: staff
- `GET /api/staff/payment-queue/:id/proof` - roles: staff

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
