# super-admin / site-designer

Super Admin access to the shared club-site designer. The Admin path remains the approval workflow; this mount allows a Super Admin to select a club, edit a separate draft, preview it, and publish it directly with an audit event.

**Roles:** `super_admin`  
**Mount:** `/api/super-admin/site-designer`  
**Tables:** `clubs`, `club_domains`, `site_versions`, `site_settings`, `media_assets`, `audit_logs`

All draft, history, media, preview, and publish routes require a `club_id` query parameter, except the club list and the selected-club preview data route.

## Endpoints

- `GET /clubs` - list non-archived clubs and their ready public website URL.
- `GET /clubs/:id/preview-data` - load public courts and enabled events for the selected club.
- `GET /options` - available templates, fonts, section kinds, and default configuration.
- `GET /draft?club_id=:id` - get or create the Super Admin's independent draft.
- `PUT /draft?club_id=:id` - validate and save the draft.
- `DELETE /draft?club_id=:id` - discard the Super Admin's draft.
- `GET /history?club_id=:id` - list the selected club's version history.
- `POST /preview?club_id=:id` - create a one-hour private preview token.
- `GET /preview/:token?club_id=:id` - load the draft configuration for the token.
- `GET /media?club_id=:id` and `POST /media?club_id=:id` - list and upload club site media.
- `POST /publish?club_id=:id` - publish the draft, archive the prior live version, and audit the action.

Publishing is rejected while a different creator has a submitted or approved design awaiting resolution. The previous live version remains in history.
