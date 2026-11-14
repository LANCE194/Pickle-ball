module.exports = {
  ROLES: ['super_admin', 'admin', 'staff', 'coach_referee', 'player', 'guest'],
  TEAM_ROLES: ['admin', 'staff', 'coach_referee'],
  // Who may create whom (A0 account creation chain).
  CREATOR_OF: { admin: ['super_admin'], staff: ['admin'], coach_referee: ['admin'], player: ['admin', 'staff'] },
  DEFAULT_SETTINGS: {
    booking_hold_minutes: 30, cancellation_cutoff_hours: 12, tournament_rest_minutes: 30,
    membership_reminder_days: 7, booking_reminder_hours: 2, max_booking_hours: 3, min_booking_hours: 1,
    opening_time: '06:00', closing_time: '22:00', peak_start: '17:00', peak_end: '21:00',
    failed_login_limit: 5, lock_minutes: 15, session_idle_minutes: 30, image_limit_mb: 5,
    club_name: 'DinkNest',
  },
  FRIENDLY: {
    INVALID_CREDENTIALS: 'That did not work. Check your details and try again.',
    FORBIDDEN: 'You do not have access to this page. Please ask the front desk.',
    FEATURE_OFF: 'This feature is not turned on for your club.',
    SERVER: 'Something went wrong on our side. Please try again.',
    SLOT_TAKEN: 'That time was just taken. Here are other free times on the same day.',
  },
};
