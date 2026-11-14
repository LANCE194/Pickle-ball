const site = require('../../../../shared/services/site');
const events = require('../../../../shared/services/events');
const courts = require('../../../../shared/services/courts');
const feature = require('../../../../shared/services/feature');
// Public home: the LIVE design only (never a draft), public events only, no personal data.
exports.home = async req => {
  const clubId = req.club && req.club.id;
  const pub = await site.publicConfig(clubId); if (pub.coming_soon) return { coming_soon: true, config: pub.config };
  return { coming_soon: false, config: pub.config, events: (await feature.isEnabled('events_announcements', clubId)) ? (await events.list('guest', { clubId })).slice(0, 3) : [], courts: await courts.list({ publicOnly: true, clubId }) };
};
