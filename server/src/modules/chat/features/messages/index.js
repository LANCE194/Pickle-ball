module.exports = {
  key: 'chat.messages',
  folder: 'messages',
  featureKey: 'chat_messages',
  label: 'Messages',
  mountPath: '/api/chat/messages',
  roles: ['admin', 'staff', 'coach_referee', 'player', 'super_admin'],
  order: 1,
  router: require('./routes'),
};
