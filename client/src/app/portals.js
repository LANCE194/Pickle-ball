// Each role's feature manifests are loaded only when that portal opens; shared manifests expose role-neutral features.
const loaders = import.meta.glob('../portals/*/features/*/index.js');
export async function loadManifests(slug) {
  const entries = Object.entries(loaders).filter(([p]) => p.startsWith(`../portals/${slug}/`) || (slug !== 'guest' && p.startsWith('../portals/shared/')));
  const mods = await Promise.all(entries.map(([, load]) => load()));
  return mods.map(m => m.default).sort((a, b) => a.order - b.order);
}
export const SA_PATH = import.meta.env.VITE_SUPER_ADMIN_PATH || '';
