# Screens and USER-FRIENDLY SCORECARD (section M)

> **Honest status:** every screen below is built from the shared components so the rules hold by construction. The build was syntax-checked and its logic unit-tested, but it was **not run in a browser** in the environment that produced it. Tick each box yourself on the first run (see TEST_CHECKLIST.md). Columns: plain words | one main button | works at 360 px | loading state | empty state | plain-words error | asks before cancel/archive/delete | helper text on forms | status with colour + icon + word.

| Role | Screen | Main button | Notes | Checked in browser |
|---|---|---|---|---|
| super-admin | Admins (AdminsPage.jsx) | core | PageHeader + shared components | [ ] |
| super-admin | Deployments (DeploymentsPage.jsx) | core | PageHeader + shared components | [ ] |
| super-admin | Features (FeatureAvailabilityPage.jsx) | core | PageHeader + shared components | [ ] |
| super-admin | Modules (ModulesPage.jsx) | core | PageHeader + shared components | [ ] |
| super-admin | Audit Logs (AuditLogsPage.jsx) | core | PageHeader + shared components | [ ] |
| super-admin | Sessions (SessionsPage.jsx) | core | PageHeader + shared components | [ ] |
| super-admin | Backups (BackupsPage.jsx) | core | PageHeader + shared components | [ ] |
| super-admin | Settings (SystemSettingsPage.jsx) | core | PageHeader + shared components | [ ] |
| super-admin | Launch status (LaunchStatusPage.jsx) | core | PageHeader + shared components | [ ] |
| admin | Dashboard (DashboardPage.jsx) | feature: reports_dashboards | PageHeader + shared components | [ ] |
| admin | Bookings (BookingsPage.jsx) | core | PageHeader + shared components | [ ] |
| admin | Payments (PaymentsPage.jsx) | core | PageHeader + shared components | [ ] |
| admin | Courts and Rates (CourtsRatesPage.jsx) | core | PageHeader + shared components | [ ] |
| admin | Tournaments (TournamentsPage.jsx) | feature: tournaments | PageHeader + shared components | [ ] |
| admin | Members and Plans (MembersPlansPage.jsx) | feature: memberships | PageHeader + shared components | [ ] |
| admin | Staff (StaffManagementPage.jsx) | core | PageHeader + shared components | [ ] |
| admin | QR Settings (QrSettingsPage.jsx) | feature: qr_payments | PageHeader + shared components | [ ] |
| admin | Reports (ReportsPage.jsx) | feature: reports_dashboards | PageHeader + shared components | [ ] |
| admin | Events (EventsPage.jsx) | feature: events_announcements | PageHeader + shared components | [ ] |
| admin | Site Designer (PreviewPage.jsx, SiteDesignerPage.jsx) | feature: site_designer | PageHeader + shared components | [ ] |
| admin | Feature Control (FeatureControlPage.jsx) | core | PageHeader + shared components | [ ] |
| admin | Inquiries (InquiriesPage.jsx) | feature: inquiries | PageHeader + shared components | [ ] |
| admin | Settings (SettingsPage.jsx) | core | PageHeader + shared components | [ ] |
| admin | My Profile (AccountProfilePage.jsx) | core | PageHeader + shared components | [ ] |
| staff | Dashboard (DashboardPage.jsx) | feature: reports_dashboards | PageHeader + shared components | [ ] |
| staff | Bookings (BookingsPage.jsx) | core | PageHeader + shared components | [ ] |
| staff | Payment Queue (PaymentQueuePage.jsx) | core | PageHeader + shared components | [ ] |
| staff | Courts (CourtsPage.jsx) | core | PageHeader + shared components | [ ] |
| staff | Check-in (CheckInPage.jsx) | feature: checkin_attendance | PageHeader + shared components | [ ] |
| staff | Matches (MatchesScoresPage.jsx) | feature: tournaments | PageHeader + shared components | [ ] |
| staff | Members (PlayersMembersPage.jsx) | core | PageHeader + shared components | [ ] |
| staff | Events (EventsPage.jsx) | feature: events_announcements | PageHeader + shared components | [ ] |
| staff | Inquiries (InquiriesPage.jsx) | feature: inquiries | PageHeader + shared components | [ ] |
| staff | My Profile (AccountProfilePage.jsx) | core | PageHeader + shared components | [ ] |
| coach-referee | Today's Matches (TodaysMatchesPage.jsx) | feature: tournaments | PageHeader + shared components | [ ] |
| coach-referee | Score Entry (ScoreEntryPage.jsx) | feature: tournaments | PageHeader + shared components | [ ] |
| coach-referee | Players (AssignedPlayersPage.jsx) | feature: player_profiles_skill | PageHeader + shared components | [ ] |
| coach-referee | Profile (ProfilePage.jsx) | core | PageHeader + shared components | [ ] |
| coach-referee | Notifications (NotificationsPage.jsx) | core | PageHeader + shared components | [ ] |
| player | Book Court (BookCourtPage.jsx) | core | PageHeader + shared components | [ ] |
| player | My Schedule (MySchedulePage.jsx) | core | PageHeader + shared components | [ ] |
| player | Payments (PaymentsPage.jsx, PayPage.jsx) | core | PageHeader + shared components | [ ] |
| player | My Profile and Level (MyProfileLevelPage.jsx) | core | PageHeader + shared components | [ ] |
| player | Find Players (FindPlayersPage.jsx) | feature: open_play | PageHeader + shared components | [ ] |
| player | Tournaments (TournamentDetailPage.jsx, TournamentsPage.jsx) | feature: tournaments | PageHeader + shared components | [ ] |
| player | Events (EventsPage.jsx) | feature: events_announcements | PageHeader + shared components | [ ] |
| player | Notifications (NotificationsPage.jsx) | core | PageHeader + shared components | [ ] |
| player | Membership (MembershipPage.jsx) | feature: memberships | PageHeader + shared components | [ ] |
| guest | Home (HomePage.jsx) | feature: guest_portal | PageHeader + shared components | [ ] |
| guest | Courts and Rates (CourtsRatesPage.jsx) | feature: guest_portal | PageHeader + shared components | [ ] |
| guest | Schedule (LiveAvailabilityPage.jsx) | feature: guest_portal | PageHeader + shared components | [ ] |
| guest | Events (EventsPage.jsx) | feature: guest_portal | PageHeader + shared components | [ ] |
| guest | Tournaments (PublicTournamentsPage.jsx, TournamentDetailPage.jsx) | feature: guest_portal | PageHeader + shared components | [ ] |
| guest | About / Contact (AboutContactInquiryPage.jsx) | feature: guest_portal | PageHeader + shared components | [ ] |
| guest | Player Login (PlayerLoginActivationPage.jsx) | core | PageHeader + shared components | [ ] |
| auth | Player login (PlayerLoginPage.jsx) | core | PageHeader + shared components | [ ] |
| auth | Activation (ActivationPage.jsx) | core | PageHeader + shared components | [ ] |
| auth | Team access (TeamAccessPage.jsx) | core | PageHeader + shared components | [ ] |
| auth | Super Admin login (SuperAdminLoginPage.jsx) | core | PageHeader + shared components | [ ] |

## Task walkthroughs and tap counts (EASE TARGETS)
| Task | Screens | Taps | Target |
|---|---|---|---|
| First-time player books a court | Player Home > Book a court (date) > court and time > review > Book this court | Book a Court 1, Continue 1, tap slot 1, Continue 1 = 4 to the review screen | 3 steps, max 6 taps |
| Player sends payment proof | review > Pay screen: choose picture, type reference, Send | 3 after review | 3 |
| Book again | Player Home > Book again > Continue... (court and length prefilled) | 2 to reach the time step | 2 |
| First-time activation | Contact > Code > Password | 3 short screens | 3 |
| Front desk adds a player | Members > Add a player > type name + mobile > Add player | 3 taps, name and one contact only | under 1 minute |
| Staff approves a payment | Payment Queue > Approve | 1 tap (2 with proof open) | 2 |
| Member check-in | Check-in > type name > tap the name | 2 taps | 2 taps or one scan |
| Referee enters a score | Today's Matches > Enter score > type games > Save score | under 30 seconds | 30 s |
| Admin switches a feature | Feature Control > Turn on/off (+ one confirmation if dependents) | 1 (+1) | 1 + confirm |
