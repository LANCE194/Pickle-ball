import routes from './routes';

export default {
  key: 'super-admin.dashboard',
  role: 'super_admin',
  featureKey: null,
  label: 'Platform dashboard',
  icon: 'home',
  path: 'dashboard',
  order: 1,
  menuGroup: 'Main',
  tab: 1,
  routes,
};
