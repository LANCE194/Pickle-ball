-- Base reference data. Safe to run many times. The Super Admin is NOT here: use `npm run create-super-admin`.
INSERT INTO roles (key, label) VALUES ('super_admin','Super Admin'),('admin','Admin (Owner)'),('staff','Staff'),('coach_referee','Coach / Referee'),('player','Player'),('guest','Guest') ON CONFLICT DO NOTHING;

INSERT INTO permissions (key, description) VALUES
 ('accounts.create_admin','Create Admin accounts'),('accounts.create_team','Create Staff and Coach accounts'),('players.add','Add players and members'),
 ('qr.manage','Upload or change QR codes'),('courts.manage','Manage courts (full)'),('courts.edit','Edit court details and status'),('prices.change','Change prices'),
 ('bookings.walk_in','Create walk-in bookings'),('bookings.own','Book own court'),('payments.verify','Verify payments'),('tournaments.create','Create tournaments'),('tournaments.draft','Prepare tournament drafts'),
 ('tournaments.join','Join tournaments'),('matches.score','Enter match scores'),('reports.full','Full reports and analytics'),('reports.daily','Daily reports'),('events.post','Post announcements and events'),
 ('site.edit','Edit site design (draft)'),('site.deploy','Approve, deploy, roll back design'),('inquiries.view','View guest inquiries'),('profiles.sensitive','View sensitive profile fields'),
 ('features.toggle','Enable or disable available features'),('features.control','Make features available, lock, handle requests'),('features.request','Submit a feature request'),('system.settings','Settings, audit logs, backups')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_key, permission_key) VALUES
 ('super_admin','accounts.create_admin'),('super_admin','players.add'),('super_admin','qr.manage'),('super_admin','courts.manage'),('super_admin','prices.change'),('super_admin','bookings.walk_in'),('super_admin','payments.verify'),
 ('super_admin','tournaments.create'),('super_admin','matches.score'),('super_admin','reports.full'),('super_admin','events.post'),('super_admin','site.edit'),('super_admin','site.deploy'),('super_admin','inquiries.view'),
 ('super_admin','profiles.sensitive'),('super_admin','features.toggle'),('super_admin','features.control'),('super_admin','system.settings'),
 ('admin','accounts.create_team'),('admin','players.add'),('admin','qr.manage'),('admin','courts.manage'),('admin','prices.change'),('admin','bookings.walk_in'),('admin','payments.verify'),('admin','tournaments.create'),
 ('admin','matches.score'),('admin','reports.full'),('admin','events.post'),('admin','site.edit'),('admin','inquiries.view'),('admin','profiles.sensitive'),('admin','features.toggle'),('admin','features.request'),
 ('staff','players.add'),('staff','courts.edit'),('staff','bookings.walk_in'),('staff','payments.verify'),('staff','tournaments.draft'),('staff','matches.score'),('staff','reports.daily'),('staff','events.post'),('staff','inquiries.view'),
 ('coach_referee','matches.score'),('player','bookings.own'),('player','tournaments.join')
ON CONFLICT DO NOTHING;

-- Feature catalog. Core features are always on. Optional features start available and enabled; Super Admin can lock or hide them.
INSERT INTO features (key, label, description, area, is_core, requires) VALUES
 ('auth_sessions','Sign-in and sessions','People sign in with their own account. Always on.','Core',true,'[]'),
 ('audit_logs','Audit log','Keeps a record of who did what. Always on.','Core',true,'[]'),
 ('courts','Courts','Your courts, rates and opening hours. Always on.','Core',true,'[]'),
 ('bookings_schedule','Bookings and schedule','Court bookings and the schedule calendar. Always on.','Core',true,'[]'),
 ('notifications_inapp','In-app notifications','The notification bell. Always on.','Core',true,'[]'),
 ('guest_portal','Public website','Visitors can see courts, rates, schedule and events without logging in.','Website',false,'[]'),
 ('recurring_bookings','Weekly repeat bookings','Front desk can book the same court every week.','Booking',false,'[]'),
 ('qr_payments','QR payments','Players pay with GCash, Maya or bank QR codes and send proof.','Payments',false,'[]'),
 ('pay_at_court','Pay at the court','Players can choose to pay when they arrive.','Payments',false,'[]'),
 ('player_profiles_skill','Player profiles and skill levels','Skill ratings, level checks and rating history.','Players',false,'[]'),
 ('tournaments','Tournaments','Create tournaments, brackets, schedules and live standings.','Competition',false,'["player_profiles_skill"]'),
 ('open_play','Find players (open play)','Players post open games and others join by level.','Competition',false,'["player_profiles_skill"]'),
 ('memberships','Memberships','Plans, discounts, renewals and expiry reminders.','Players',false,'[]'),
 ('checkin_attendance','Check-in and attendance','Front desk check-in and an attendance log.','Players',false,'[]'),
 ('events_announcements','Events and announcements','Post news and events for guests, players or members only.','Club',false,'[]'),
 ('reports_dashboards','Reports and dashboards','Counters, charts and daily, weekly and monthly reports.','Club',false,'[]'),
 ('email_notifications','Email messages','Also send notifications by email.','Messages',false,'[]'),
 ('chat_messages','Direct messages','One-to-one text messages with active users across clubs.','Messages',false,'[]'),
 ('sms_notifications','Text messages (SMS)','Also send notifications by text. Needs an SMS provider.','Messages',false,'[]'),
 ('site_designer','Site Designer','Design the public website. The Super Admin approves before it goes live.','Website',false,'[]'),
 ('inquiries','Website inquiries','Messages from the website contact form.','Website',false,'[]'),
 ('realtime_updates','Live updates','Screens refresh by themselves. When off, screens refresh every 15 to 30 seconds.','Core tools',false,'[]')
ON CONFLICT (key) DO UPDATE SET label=EXCLUDED.label, description=EXCLUDED.description, area=EXCLUDED.area, requires=EXCLUDED.requires, is_core=EXCLUDED.is_core;

INSERT INTO site_settings (id, launch_status) VALUES (1, 'pre_launch') ON CONFLICT DO NOTHING;

INSERT INTO courts (club_id, court_number, name, type, surface, hourly_rate, peak_rate, offpeak_rate) VALUES
 ('00000000-0000-0000-0000-000000000001',1,'Court 1 - Indoor','indoor','Acrylic',300,400,300),
 ('00000000-0000-0000-0000-000000000001',2,'Court 2 - Indoor','indoor','Acrylic',300,400,300),
 ('00000000-0000-0000-0000-000000000001',3,'Court 3 - Outdoor','outdoor','Cushioned',250,350,250)
ON CONFLICT (club_id, court_number) DO NOTHING;

INSERT INTO settings (club_id, key, value) VALUES
 ('00000000-0000-0000-0000-000000000001','booking_hold_minutes','30'),('00000000-0000-0000-0000-000000000001','cancellation_cutoff_hours','12'),('00000000-0000-0000-0000-000000000001','tournament_rest_minutes','30'),('00000000-0000-0000-0000-000000000001','membership_reminder_days','7'),('00000000-0000-0000-0000-000000000001','booking_reminder_hours','2'),
 ('00000000-0000-0000-0000-000000000001','max_booking_hours','3'),('00000000-0000-0000-0000-000000000001','min_booking_hours','1'),('00000000-0000-0000-0000-000000000001','opening_time','"06:00"'),('00000000-0000-0000-0000-000000000001','closing_time','"22:00"'),('00000000-0000-0000-0000-000000000001','peak_start','"17:00"'),('00000000-0000-0000-0000-000000000001','peak_end','"21:00"'),
 ('00000000-0000-0000-0000-000000000001','failed_login_limit','5'),('00000000-0000-0000-0000-000000000001','lock_minutes','15'),('00000000-0000-0000-0000-000000000001','session_idle_minutes','30'),('00000000-0000-0000-0000-000000000001','image_limit_mb','5'),('00000000-0000-0000-0000-000000000001','club_name','"DinkNest"')
ON CONFLICT (club_id, key) DO NOTHING;
