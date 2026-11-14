# player / payments - Payments

**Purpose:** Payments for the player role.
**Feature key:** core (always on)
**Roles:** player
**Tables used:** payments, payment_qr_codes

## Endpoints (mounted at `/api/player/payments`)
- `GET /api/player/payments` - roles: player
- `GET /api/player/payments/:id` - roles: player
- `POST /api/player/payments/:id/proof` - roles: player
- `POST /api/player/payments/:id/pay-at-court` - roles: player
- `GET /api/player/payments/qr/:qrId/image` - roles: player

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
