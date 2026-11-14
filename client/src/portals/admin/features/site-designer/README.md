# client admin / site-designer - Site Designer

Shared three-pane editor for **Site Designer**. Admins edit their own club draft and submit it for review; Super Admins select a club and publish a separate audited draft.

- Admin menu: feature key `site_designer`, group "Website", order 11.
- Super Admin menu: registered separately in `client/src/portals/super-admin/features/site-designer`; its designer also lists submitted Admin designs with a preview and links to approval actions.
- Preview: uses the same renderer as the public club site.
- API contracts are listed in `server/src/modules/admin/features/site-designer/README.md` and `server/src/modules/super-admin/features/site-designer/README.md`.
- Edit this folder, its README and `tests/` together.
