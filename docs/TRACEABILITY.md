# Feature traceability (final matrix)

| Feature | Where | Status |
|---|---|---|
| F1 Authentication and access | server modules/auth/*, shared/services/authlogic, accounts, session; client portals/auth + shared/components/PlayerAuth | Built (needs first-run verification) |
| F2 Guest Portal | modules/guest/*; client portals/guest/* | Built (needs first-run verification) |
| F3 Court Management | shared/services/courts; admin/courts-rates, staff/courts | Built (needs first-run verification) |
| F4 Booking System, F6 Schedule | shared/services/booking, frontdesk; player/book-court, my-schedule; admin|staff/bookings (BookingsDesk with drag and drop, day/week/month) | Built (needs first-run verification) |
| F5 QR Payment | shared/services/payment, qr, paymentqueue; admin/qr-settings, player/payments, staff/payment-queue, admin/payments | Built (needs first-run verification) |
| F7 Player Profile, F8 Skill Level | shared/services/players, rating; player/my-profile-level; staff|admin players desks | Built (needs first-run verification) |
| F9 Tournaments | shared/services/tournaments, bracket; admin/tournaments, player/tournaments, guest/public-tournaments, coach/staff scores | Built (needs first-run verification) |
| F10 Matchmaking / Open Play | player/find-players | Built (needs first-run verification) |
| F11 Member Management | shared/services/membership; admin/members-plans, staff/check-in, player/membership | Built (needs first-run verification) |
| F12 Staff and Role Management | admin/staff-management, super-admin/admins, shared/services/accounts | Built (needs first-run verification) |
| F13 Events | shared/services/events; admin|staff|player|guest events | Built (needs first-run verification) |
| F14 Notifications | shared/services/notification; bell + email | Built (needs first-run verification) |
| F15 Reports and Dashboards | shared/services/reports; admin/reports, dashboards | Built (needs first-run verification) |
| F16 Audit Log and Security | audit service + middleware; super-admin/audit-logs | Built (needs first-run verification) |
| F17 Site Designer and Deployment | shared/services/site; admin/site-designer, super-admin/deployments, launch-status | Built (needs first-run verification) |
| F18 Feature Control Center | shared/services/feature; admin/feature-control, super-admin/feature-availability, requireFeature/FeatureGate | Built (needs first-run verification) |
| F19 Real-Time Data | realtime/gateway; client lib/realtime, useClock, useApi polling fallback | Built (needs first-run verification) |
| F20 Self-service Profiles | admin/account-profile, staff/account-profile, coach-referee/profile, player/my-profile-level; existing staff_profiles, referee_profiles and players tables | Built (needs first-run verification) |

See README "Known limits and remaining risks" for the items that are intentionally thin.
