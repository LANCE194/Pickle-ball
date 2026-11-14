# Database tables

SQLite (one file: `data/dinknest.db`, created automatically). Times are stored in UTC as ISO text and shown in Asia/Manila. Soft delete uses `archived_at`. Enums are CHECK constraints, booleans are 0/1, JSON columns are text.

| Table | Columns |
|---|---|
| roles | id, CREATE, CREATE, role_key |
| clubs | id, name, slug, status, created_by, created_at |
| club_domains | id, club_id, host, verification_status, verification_token, https_ready, verified_at, is_default, created_at |
| users | id, club_id, role, email, status, must_change_password, temp_password_expires_at, totp_secret, failed_logins, created_by, last_login_at, created_at |
| sessions | id, club_id, user_id, token_hash, created_at |
| otp_codes | id, club_id, user_id, code_hash, expires_at, attempts |
| players | id, club_id, user_id, first_name, birthdate, street, emergency_name, skill_level, level_verified, dominant_hand, heard_about, waiver_accepted, medical_notes, guardian_name, status, privacy_consent, created_by, created_at, archived_at |
| staff_profiles | id, club_id, user_id, first_name, birthdate, emergency_name, employee_id, employment_status, permissions, club_name, created_at |
| referee_profiles | id, club_id, user_id, first_name, birthdate, emergency_name, role_type, certification_name, specialization, level_min, created_at |
| inquiries | id, club_id, name, interest, message, handled, created_at |
| features | key, is_core, available, locked, requires |
| club_features | club_id, feature_key, enabled, changed_by |
| feature_requests | id, club_id, requested_by, title, type, priority, status, created_at |
| settings | club_id, key |
| courts | id, club_id, court_number, type, surface, hourly_rate, status, opens_at, peak_start, created_at |
| court_blocks | id, club_id, court_id, starts_at, created_by |
| bookings | id, club_id, court_id, player_id, booked_by, starts_at, duration_hours, players_count, status, price, is_walk_in, expires_at, open_play_post_id, created_at |
| payment_qr_codes | id, club_id, provider, account_name, enabled, uploaded_by |
| payments | id, club_id, booking_id, player_id, amount, status, qr_code_id, proof_path, reviewed_by, created_at |
| membership_plans | id, club_id, name, discount_percent, active |
| memberships | id, club_id, player_id, starts_on, status, reminder_sent_at |
| tournaments | id, club_id, name, format, category, level_min, age_bracket, rules, status, visibility, created_by |
| tournament_entries | id, club_id, tournament_id, player_id, status, seed |
| matches | id, club_id, tournament_id, round, bracket, entry_a, winner_entry, loser_next_match_id, court_id, referee_user_id, status, created_at |
| match_scores | id, club_id, match_id, score_a, entered_by, created_at |
| rating_history | id, club_id, player_id, reason, created_at |
| open_play_posts | id, club_id, host_player_id, starts_at, format, spots_needed, status |
| open_play_members | club_id, post_id, status, needs_host_approval |
| announcements | id, club_id, title, visibility, event_starts_at, created_at |
| notifications | id, club_id, user_id, kind, created_at |
| attendance | id, club_id, player_id |
| audit_logs | id, club_id, user_id, details |
| site_settings | club_id, id, launch_status, updated_by |
| site_themes | id, club_id, name |
| site_pages | id, club_id, slug |
| site_sections | id, club_id, page_id |
| site_versions | id, club_id, version_no, status, config_json, reviewed_by, preview_token, created_at |
| media_assets | id, club_id, path, uploaded_by |
| chat_conversations | id, participant_low, participant_high, created_by, created_at |
| chat_participants | conversation_id, user_id, last_read_at, joined_at |
| chat_messages | id, conversation_id, sender_id, body, created_at |

## Status values (CHECK constraints)
- **clubs.status**: active,pending,disabled,archived
- **club_domains.verification_status**: pending,verified,rejected,disabled
- **users.status**: invited,active,suspended,archived
- **players.status**: active,inactive,suspended,pending_verification
- **referee_profiles.role_type**: coach,referee,both
- **inquiries.interest**: booking,tournament,membership,other
- **feature_requests.type**: new feature,change,unlock
- **feature_requests.priority**: low,normal,high
- **feature_requests.status**: new,reviewing,accepted,in_progress,done,declined
- **courts.type**: indoor,outdoor
- **courts.status**: available,maintenance,closed
- **bookings.status**: pending,confirmed,cancelled,completed,no_show,expired
- **payment_qr_codes.provider**: gcash,maya,bank
- **payments.status**: unpaid,pending_verification,approved,rejected,pay_at_court_pending,paid_at_court
- **memberships.status**: active,expiring,expired,cancelled
- **tournaments.format**: single_elimination,double_elimination,round_robin
- **tournaments.category**: singles,doubles,mixed
- **tournaments.status**: draft,registration_open,registration_closed,in_progress,completed,cancelled
- **tournament_entries.status**: pending,approved,waitlisted,rejected,withdrawn
- **matches.bracket**: W,L,F,RR
- **matches.status**: scheduled,in_progress,completed,forfeited
- **open_play_posts.status**: open,full,closed,cancelled
- **open_play_members.status**: requested,confirmed,declined,left
- **announcements.visibility**: public,members
- **site_settings.launch_status**: pre_launch,live
- **site_versions.status**: draft,submitted,changes_requested,approved,live,rejected,archived

## Guarantees
- No double booking: database triggers (`bookings_no_overlap_ins`, `bookings_no_overlap_upd`) refuse an overlapping pending, confirmed or completed booking on the same court, and SQLite runs one write at a time.
- One Super Admin only: partial unique index `users_single_super_admin`.
- Foreign keys are switched on.
