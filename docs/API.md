# API route list

Base URL: `/api`. Every request sends `Authorization: Bearer <this tab's token>`. Errors are `{ error, code, fields? }` with friendly wording.

## Core
| Method | Path | Who |
|---|---|---|
| GET | /api/time | everyone (server clock, Asia/Manila) |
| GET | /api/health | everyone |
| GET | /api/features | everyone (feature switches for menus) |
| GET | /api/site/public | everyone (LIVE site design only; Coming Soon flag) |
| GET | /api/auth/me | signed in |
| POST | /api/auth/logout | signed in (revokes ONLY this tab's session) |
| POST | /api/auth/change-password | signed in |
| GET | /api/notifications, POST /api/notifications/read | signed in |
| GET | /api/files/:kind/:name | private files need the right role; courts, media, events pictures are public |
| WS | /ws?token= | role-scoped realtime channels |

## super-admin (private portal)
| Method | Path | Roles | Feature key |
|---|---|---|---|
| GET | /api/super-admin/admins | super_admin | core |
| POST | /api/super-admin/admins | super_admin | core |
| POST | /api/super-admin/admins/:id/reset-password | super_admin | core |
| POST | /api/super-admin/admins/:id/status | super_admin | core |
| GET | /api/super-admin/deployments/queue | super_admin | core |
| GET | /api/super-admin/deployments/history | super_admin | core |
| POST | /api/super-admin/deployments/:id/approve | super_admin | core |
| POST | /api/super-admin/deployments/:id/changes | super_admin | core |
| POST | /api/super-admin/deployments/:id/reject | super_admin | core |
| POST | /api/super-admin/deployments/:id/rollback | super_admin | core |
| GET | /api/super-admin/feature-availability | super_admin | core |
| PATCH | /api/super-admin/feature-availability/:key | super_admin | core |
| GET | /api/super-admin/feature-availability/requests | super_admin | core |
| PATCH | /api/super-admin/feature-availability/requests/:id | super_admin | core |
| GET | /api/super-admin/modules | super_admin | core |
| GET | /api/super-admin/audit-logs | super_admin | core |
| GET | /api/super-admin/sessions | super_admin | core |
| POST | /api/super-admin/sessions/:id/revoke | super_admin | core |
| GET | /api/super-admin/backups | super_admin | core |
| POST | /api/super-admin/backups | super_admin | core |
| GET | /api/super-admin/backups/:name | super_admin | core |
| GET | /api/super-admin/system-settings | super_admin | core |
| PUT | /api/super-admin/system-settings | super_admin | core |
| GET | /api/super-admin/launch-status | super_admin | core |
| PUT | /api/super-admin/launch-status | super_admin | core |

## admin
| Method | Path | Roles | Feature key |
|---|---|---|---|
| GET | /api/admin/dashboard | admin, super_admin | reports_dashboards |
| GET | /api/admin/bookings | admin, super_admin | core |
| POST | /api/admin/bookings/walk-in | admin, super_admin | core |
| POST | /api/admin/bookings/recurring | admin, super_admin | core |
| PATCH | /api/admin/bookings/:id/move | admin, super_admin | core |
| POST | /api/admin/bookings/:id/cancel | admin, super_admin | core |
| GET | /api/admin/bookings/slots | admin, super_admin | core |
| GET | /api/admin/payments | admin, super_admin | core |
| POST | /api/admin/payments/:id/approve | admin, super_admin | core |
| POST | /api/admin/payments/:id/reject | admin, super_admin | core |
| GET | /api/admin/payments/:id/proof | admin, super_admin | core |
| GET | /api/admin/courts-rates | admin, super_admin | core |
| POST | /api/admin/courts-rates | admin, super_admin | core |
| PATCH | /api/admin/courts-rates/:id | admin, super_admin | core |
| POST | /api/admin/courts-rates/:id/photo | admin, super_admin | core |
| POST | /api/admin/courts-rates/:id/archive | admin, super_admin | core |
| POST | /api/admin/courts-rates/:id/restore | admin, super_admin | core |
| GET | /api/admin/courts-rates/blocks | admin, super_admin | core |
| POST | /api/admin/courts-rates/:id/blocks | admin, super_admin | core |
| DELETE | /api/admin/courts-rates/blocks/:blockId | admin, super_admin | core |
| GET | /api/admin/tournaments | admin, super_admin | tournaments |
| POST | /api/admin/tournaments | admin, super_admin | tournaments |
| PATCH | /api/admin/tournaments/:id | admin, super_admin | tournaments |
| POST | /api/admin/tournaments/:id/status | admin, super_admin | tournaments |
| GET | /api/admin/tournaments/:id/entries | admin, super_admin | tournaments |
| POST | /api/admin/tournaments/entries/:entryId/decision | admin, super_admin | tournaments |
| POST | /api/admin/tournaments/:id/generate | admin, super_admin | tournaments |
| GET | /api/admin/tournaments/:id/matches | admin, super_admin | tournaments |
| GET | /api/admin/tournaments/:id/bracket.pdf | admin, super_admin | tournaments |
| GET | /api/admin/members-plans/plans | admin, super_admin | memberships |
| POST | /api/admin/members-plans/plans | admin, super_admin | memberships |
| PATCH | /api/admin/members-plans/plans/:id | admin, super_admin | memberships |
| GET | /api/admin/members-plans/members | admin, super_admin | memberships |
| POST | /api/admin/members-plans/members | admin, super_admin | memberships |
| POST | /api/admin/members-plans/members/:playerId/renew | admin, super_admin | memberships |
| GET | /api/admin/members-plans/players | admin, super_admin | memberships |
| POST | /api/admin/members-plans/players | admin, super_admin | memberships |
| GET | /api/admin/members-plans/players/:id | admin, super_admin | memberships |
| PATCH | /api/admin/members-plans/players/:id | admin, super_admin | memberships |
| POST | /api/admin/members-plans/players/:id/resend-invite | admin, super_admin | memberships |
| POST | /api/admin/members-plans/players/:id/reset-password | admin, super_admin | memberships |
| POST | /api/admin/members-plans/players/:id/verify-level | admin, super_admin | memberships |
| POST | /api/admin/members-plans/players/:id/override-level | admin, super_admin | memberships |
| POST | /api/admin/members-plans/players/:id/archive | admin, super_admin | memberships |
| POST | /api/admin/members-plans/players/:id/restore | admin, super_admin | memberships |
| GET | /api/admin/staff-management | admin, super_admin | core |
| POST | /api/admin/staff-management | admin, super_admin | core |
| PATCH | /api/admin/staff-management/:userId/permissions | admin, super_admin | core |
| POST | /api/admin/staff-management/:userId/reset-password | admin, super_admin | core |
| POST | /api/admin/staff-management/:userId/status | admin, super_admin | core |
| GET | /api/admin/qr-settings | admin, super_admin | qr_payments |
| POST | /api/admin/qr-settings | admin, super_admin | qr_payments |
| PATCH | /api/admin/qr-settings/:id | admin, super_admin | qr_payments |
| POST | /api/admin/qr-settings/:id/toggle | admin, super_admin | qr_payments |
| DELETE | /api/admin/qr-settings/:id | admin, super_admin | qr_payments |
| GET | /api/admin/reports/:period | admin, super_admin | reports_dashboards |
| GET | /api/admin/reports/:period/export.xlsx | admin, super_admin | reports_dashboards |
| GET | /api/admin/reports/:period/export.pdf | admin, super_admin | reports_dashboards |
| GET | /api/admin/reports/attendance.xlsx | admin, super_admin | reports_dashboards |
| GET | /api/admin/events | admin, super_admin | events_announcements |
| POST | /api/admin/events | admin, super_admin | events_announcements |
| PATCH | /api/admin/events/:id | admin, super_admin | events_announcements |
| POST | /api/admin/events/:id/image | admin, super_admin | events_announcements |
| POST | /api/admin/events/:id/archive | admin, super_admin | events_announcements |
| POST | /api/admin/events/:id/restore | admin, super_admin | events_announcements |
| GET | /api/admin/site-designer/draft | admin, super_admin | site_designer |
| PUT | /api/admin/site-designer/draft | admin, super_admin | site_designer |
| DELETE | /api/admin/site-designer/draft | admin, super_admin | site_designer |
| POST | /api/admin/site-designer/submit | admin, super_admin | site_designer |
| GET | /api/admin/site-designer/history | admin, super_admin | site_designer |
| POST | /api/admin/site-designer/preview | admin, super_admin | site_designer |
| GET | /api/admin/site-designer/preview/:token | admin, super_admin | site_designer |
| GET | /api/admin/site-designer/media | admin, super_admin | site_designer |
| POST | /api/admin/site-designer/media | admin, super_admin | site_designer |
| GET | /api/admin/site-designer/options | admin, super_admin | site_designer |
| GET | /api/admin/feature-control | admin, super_admin | core |
| POST | /api/admin/feature-control/:key | admin, super_admin | core |
| GET | /api/admin/feature-control/requests | admin, super_admin | core |
| POST | /api/admin/feature-control/requests | admin, super_admin | core |
| GET | /api/admin/feature-control/wizard | admin, super_admin | core |
| POST | /api/admin/feature-control/wizard | admin, super_admin | core |
| GET | /api/admin/inquiries | admin, super_admin | inquiries |
| POST | /api/admin/inquiries/:id/handled | admin, super_admin | inquiries |
| GET | /api/admin/settings | admin, super_admin | core |
| PUT | /api/admin/settings | admin, super_admin | core |
| GET | /api/admin/account-profile | admin | core |
| PATCH | /api/admin/account-profile | admin | core |
| POST | /api/admin/account-profile/photo | admin | core |

## staff
| Method | Path | Roles | Feature key |
|---|---|---|---|
| GET | /api/staff/dashboard | staff | reports_dashboards |
| GET | /api/staff/bookings | staff | core |
| POST | /api/staff/bookings/walk-in | staff | core |
| POST | /api/staff/bookings/recurring | staff | core |
| PATCH | /api/staff/bookings/:id/move | staff | core |
| POST | /api/staff/bookings/:id/cancel | staff | core |
| GET | /api/staff/bookings/slots | staff | core |
| GET | /api/staff/payment-queue | staff | core |
| POST | /api/staff/payment-queue/:id/approve | staff | core |
| POST | /api/staff/payment-queue/:id/reject | staff | core |
| POST | /api/staff/payment-queue/:id/paid-at-court | staff | core |
| GET | /api/staff/payment-queue/:id/proof | staff | core |
| GET | /api/staff/courts | staff | core |
| PATCH | /api/staff/courts/:id | staff | core |
| GET | /api/staff/check-in | staff | checkin_attendance |
| POST | /api/staff/check-in | staff | checkin_attendance |
| GET | /api/staff/check-in/search | staff | checkin_attendance |
| GET | /api/staff/matches-scores | staff | tournaments |
| POST | /api/staff/matches-scores/:id/scores | staff | tournaments |
| GET | /api/staff/players-members | staff | core |
| POST | /api/staff/players-members | staff | core |
| GET | /api/staff/players-members/:id | staff | core |
| PATCH | /api/staff/players-members/:id | staff | core |
| POST | /api/staff/players-members/:id/resend-invite | staff | core |
| POST | /api/staff/players-members/:id/reset-password | staff | core |
| POST | /api/staff/players-members/:id/verify-level | staff | core |
| POST | /api/staff/players-members/:id/archive | staff | core |
| GET | /api/staff/events | staff | events_announcements |
| POST | /api/staff/events | staff | events_announcements |
| PATCH | /api/staff/events/:id | staff | events_announcements |
| GET | /api/staff/inquiries | staff | inquiries |
| POST | /api/staff/inquiries/:id/handled | staff | inquiries |
| GET | /api/staff/account-profile | staff | core |
| PATCH | /api/staff/account-profile | staff | core |
| POST | /api/staff/account-profile/photo | staff | core |

## coach-referee
| Method | Path | Roles | Feature key |
|---|---|---|---|
| GET | /api/coach-referee/todays-matches | coach_referee | tournaments |
| POST | /api/coach-referee/score-entry/:id | coach_referee | tournaments |
| GET | /api/coach-referee/assigned-players | coach_referee | player_profiles_skill |
| POST | /api/coach-referee/assigned-players/:id/verify-level | coach_referee | player_profiles_skill |
| GET | /api/coach-referee/profile | coach_referee | core |
| PATCH | /api/coach-referee/profile | coach_referee | core |
| POST | /api/coach-referee/profile/photo | coach_referee | core |
| GET | /api/coach-referee/notifications | coach_referee | core |
| POST | /api/coach-referee/notifications/read | coach_referee | core |

## player
| Method | Path | Roles | Feature key |
|---|---|---|---|
| GET | /api/player/book-court/slots | player | core |
| GET | /api/player/book-court/quote | player | core |
| POST | /api/player/book-court | player | core |
| GET | /api/player/book-court/last | player | core |
| GET | /api/player/my-schedule | player | core |
| POST | /api/player/my-schedule/:id/cancel | player | core |
| GET | /api/player/payments | player | core |
| GET | /api/player/payments/:id | player | core |
| POST | /api/player/payments/:id/proof | player | core |
| POST | /api/player/payments/:id/pay-at-court | player | core |
| GET | /api/player/payments/qr/:qrId/image | player | core |
| GET | /api/player/my-profile-level | player | core |
| PATCH | /api/player/my-profile-level | player | core |
| POST | /api/player/my-profile-level/photo | player | core |
| GET | /api/player/my-profile-level/history | player | core |
| GET | /api/player/find-players | player | open_play |
| POST | /api/player/find-players | player | open_play |
| GET | /api/player/find-players/suggestions | player | open_play |
| POST | /api/player/find-players/:id/join | player | open_play |
| POST | /api/player/find-players/:id/leave | player | open_play |
| POST | /api/player/find-players/:id/members/:playerId | player | open_play |
| POST | /api/player/find-players/:id/book | player | open_play |
| POST | /api/player/find-players/:id/cancel | player | open_play |
| GET | /api/player/tournaments | player | tournaments |
| GET | /api/player/tournaments/:id | player | tournaments |
| POST | /api/player/tournaments/:id/register | player | tournaments |
| POST | /api/player/tournaments/entries/:entryId/withdraw | player | tournaments |
| GET | /api/player/tournaments/:id/matches | player | tournaments |
| GET | /api/player/tournaments/partners | player | tournaments |
| GET | /api/player/events | player | events_announcements |
| GET | /api/player/notifications | player | core |
| POST | /api/player/notifications/read | player | core |
| GET | /api/player/membership | player | memberships |
| GET | /api/player/membership/plans | player | memberships |
| POST | /api/player/membership/join | player | memberships |

## guest
| Method | Path | Roles | Feature key |
|---|---|---|---|
| GET | /api/guest/home | guest | guest_portal |
| GET | /api/guest/courts-rates | guest | guest_portal |
| GET | /api/guest/live-availability | guest | guest_portal |
| GET | /api/guest/events | guest | guest_portal |
| GET | /api/guest/public-tournaments | guest | guest_portal |
| GET | /api/guest/public-tournaments/:id | guest | guest_portal |
| POST | /api/guest/about-contact-inquiry/inquiry | guest | guest_portal |
| GET | /api/guest/about-contact-inquiry | guest | guest_portal |

## auth
| Method | Path | Roles | Feature key |
|---|---|---|---|
| POST | /api/auth/player-login/login | public (rate limited) | core |
| POST | /api/auth/player-login/forgot | public (rate limited) | core |
| POST | /api/auth/player-login/reset | public (rate limited) | core |
| POST | /api/auth/activation/request | public (rate limited) | core |
| POST | /api/auth/activation/verify | public (rate limited) | core |
| POST | /api/auth/team-access/login | public (rate limited) | core |
| POST | /api/<SUPER_ADMIN_PATH>/login | public (rate limited) | core |
| POST | /api/<SUPER_ADMIN_PATH>/setup/password | public (rate limited) | core |
| POST | /api/<SUPER_ADMIN_PATH>/setup/totp | public (rate limited) | core |
| POST | /api/<SUPER_ADMIN_PATH>/setup/totp/confirm | public (rate limited) | core |
