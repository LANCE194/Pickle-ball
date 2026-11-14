import routes from './routes';
export default {
  key: 'shared.chat',
  featureKey: 'chat_messages',
  label: 'Messages',
  icon: 'mail',
  path: 'messages',
  order: 90,
  menuGroup: 'People',
  routes,
};
