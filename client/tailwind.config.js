import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
// Design tokens: brand colours, type, radius and spacing live here (never one-off values inside feature folders).
export default {
  content: [path.join(here, 'index.html'), path.join(here, 'src/**/*.{js,jsx}')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        court: 'var(--brand, var(--palette-court-green, #0B6E4F))',
        volt: 'var(--accent, var(--palette-volt-lime, #C6F432))',
        navy: 'var(--palette-deep-navy, #0B1F3A)',
        blue: { court: 'var(--palette-court-blue, #1E88E5)' },
        clay: 'var(--palette-clay-orange, #FF7A1A)',
        offwhite: 'var(--palette-off-white, #F6F8F5)',
        slate: { dn: 'var(--palette-slate, #5B6B7A)' },
        alert: 'var(--palette-alert-red, #E5484D)',
        'alert-ink': 'var(--alert-action-text, #06172D)',
      },
      fontFamily: { heading: ['Poppins', 'system-ui', 'sans-serif'], body: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: 'var(--card-radius, 12px)' },
      boxShadow: { card: '0 2px 6px rgba(11,31,58,0.07), 0 12px 32px rgba(11,31,58,0.04)', soft: '0 12px 30px rgba(11,31,58,0.08)' },
      spacing: { 4.5: '18px', 11: '44px' },
      minHeight: { tap: '44px' }, minWidth: { tap: '44px' },
      maxWidth: { page: '1200px' },
      transitionDuration: { fast: '150ms', base: '200ms' },
    },
  },
  plugins: [],
};
