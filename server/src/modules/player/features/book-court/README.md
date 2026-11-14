# player / book-court - Book Court

**Purpose:** Book Court for the player role.
**Feature key:** core (always on)
**Roles:** player
**Tables used:** bookings, payments

## Endpoints (mounted at `/api/player/book-court`)
- `GET /api/player/book-court/slots` - roles: player
- `GET /api/player/book-court/quote` - roles: player
- `POST /api/player/book-court` - roles: player
- `GET /api/player/book-court/last` - roles: player

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
