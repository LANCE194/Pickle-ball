# First-run test checklist

Tick each line after you try it. Items marked (ease) are the EASE TARGETS from the spec.

## 0. Set up
- [ ] `npm install` then `npm start` works with no other setup; `data/dinknest.db` appears; http://localhost:4000 shows the landing page
- [ ] `npm test` passes
- [ ] With `SUPER_ADMIN_EMAIL` set, a one-time password is printed at start; `/api/health` returns ok

## 1. Access and login
- [ ] No Register button anywhere; landing page shows no link or word for Admin, Staff, Coach or Super Admin
- [ ] Player not added by the club cannot log in (generic "That did not work" message)
- [ ] Invited player: First time here? > contact > code > password = 3 short screens (ease); then logged in
- [ ] A player account on Team Access, and a staff account on Player Login, both get the same generic error
- [ ] Hidden Team Access opens by tapping the logo 5 times; accepts admin, staff, coach only
- [ ] Super Admin: first login forces new password then authenticator setup; wrong code fails; no other route can create a super_admin (403)
- [ ] Admin cannot create an Admin; Staff cannot create Staff, Coach or Admin; only Admin creates Staff and Coach; only Super Admin creates Admin (403 otherwise)
- [ ] Creator must supply a permanent password when creating an Admin, Staff, Coach/Referee, or Player account; missing or weak passwords are rejected
- [ ] Newly created accounts can sign in with the supplied password and are not forced to change it at first login
- [ ] Password reset still follows the role chain, issues a one-time password, and requires a change at next login
- [ ] Two tabs / two browsers with different accounts at the same time do not log each other out (header shows name and role badge)
- [ ] Suspending an account signs it out everywhere at once

## 2. Booking and payment
- [ ] Player books in 3 steps, 4 taps from Home to review (ease); review shows Date, Time and Court name/number, price, cancellation rule
- [ ] Two browsers book the same slot at once: one succeeds, the other sees "That time was just taken" with free times on the same day
- [ ] Hold expires after 30 minutes without proof (booking becomes Hold ended and the slot is free)
- [ ] Peak, off-peak and weekend prices; member discount applies, expired members lose it
- [ ] Pay screen: QR, exact amount, reference code; proof upload accepts JPG/PNG up to 5 MB, rejects other files
- [ ] Staff Payment Queue: thumbnail, amount, player, date/time/court; Approve = confirmed + notification (ease: 2 taps); Reject needs a reason and the player can re-send
- [ ] Staff cannot reach QR Settings (no menu item, API returns 403)
- [ ] Cancel: player blocked inside the 12 hour cutoff; staff must give a reason
- [ ] Drag a booking to another time or court: conflicts are refused with a friendly message

## 3. Courts, members, check-in
- [ ] Blocked dates never show as bookable; price change does not change confirmed bookings
- [ ] Add a player in under 1 minute with name, contact, and permanent password (ease)
- [ ] Admin or Staff can add a player/member with a permanent password; membership payment rules still apply
- [ ] Check-in by name = 2 taps (ease)

## 4. Competition
- [ ] Create tournament, open sign-up, register solo and with partner, waitlist when full, approve entries
- [ ] Close sign-up, build bracket: seeded by rating, courts and times assigned, no player on two courts at once, 30 min rest
- [ ] Referee enters a score in under 30 seconds (ease); winner advances; changing a score updates the bracket and is logged
- [ ] Guests see the live standings page; printable bracket PDF works
- [ ] Open play: join outside level needs host approval; no schedule conflicts

## 5. Site Designer and features
- [ ] Admin edits a draft (autosave), previews at mobile/tablet/desktop in light and dark; cannot add scripts or raw HTML; draft never shows publicly
- [ ] Submit > Super Admin sees preview + change summary > Approve makes it live without a code change; Request changes / Reject notify the Admin; rollback restores an older design
- [ ] pre_launch shows Coming Soon to the public while Admin and Staff can still preview
- [ ] Feature Control: turn every optional feature off and on; dependency prompts appear; menus disappear live in other tabs; API returns 404; data is kept
- [ ] Admin cannot enable a feature the Super Admin has not made available

## 6. Real time
- [ ] Clock matches `/api/time`; Live / Reconnecting indicator with Last updated; stop the API and watch it reconnect and fall back to polling
- [ ] A booking in one tab updates the slot grid and dashboard counters in another tab within seconds

## 7. Usability and design (sections K, L, M)
- [ ] Every screen: one main button, same header and menu, no sideways scrolling at 360 px, loading skeletons, empty states with a next step, errors without codes, helper text on forms
- [ ] Cancel, archive and delete always ask first; archive shows Undo for 10 seconds
- [ ] Status badges always show colour, icon and word; contrast is at least 4.5:1 in light and dark; keyboard and screen reader labels work
- [ ] Ask a real player and a real front desk person to try the tasks in `docs/SCREENS.md` and write down what confused them
