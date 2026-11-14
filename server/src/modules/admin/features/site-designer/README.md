# admin / site-designer - Site Designer

**Purpose:** Site Designer for the admin role.
**Feature key:** site_designer
**Roles:** admin, super_admin (Admin mount is the owner approval workflow)
**Tables used:** site_versions, media_assets

## Endpoints (mounted at `/api/admin/site-designer`)
- `GET /api/admin/site-designer/draft` - roles: admin, super_admin - feature: site_designer
- `PUT /api/admin/site-designer/draft` - roles: admin, super_admin - feature: site_designer
- `DELETE /api/admin/site-designer/draft` - roles: admin, super_admin - feature: site_designer
- `POST /api/admin/site-designer/submit` - roles: admin, super_admin - feature: site_designer
- `GET /api/admin/site-designer/history` - roles: admin, super_admin - feature: site_designer
- `POST /api/admin/site-designer/preview` - roles: admin, super_admin - feature: site_designer
- `GET /api/admin/site-designer/preview/:token` - roles: admin, super_admin - feature: site_designer
- `GET /api/admin/site-designer/media` - roles: admin, super_admin - feature: site_designer
- `POST /api/admin/site-designer/media` - roles: admin, super_admin - feature: site_designer
- `GET /api/admin/site-designer/options` - roles: admin, super_admin - feature: site_designer

## Notes
- Permission differences are decided in this folder's `service.js`, not by role checks in shared code.
- The Super Admin's direct-edit and publish flow is mounted separately at `/api/super-admin/site-designer`; see `server/src/modules/super-admin/features/site-designer/README.md`.
- Shared logic lives in `server/src/shared/services`. This folder never imports from another feature or role.
- Change this feature by editing this folder, its README and `tests/` together.
