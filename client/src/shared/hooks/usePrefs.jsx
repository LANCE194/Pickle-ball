import { createContext, useContext, useEffect, useState } from 'react';
// Light/dark, large text and language (English with a Filipino option).
const Ctx = createContext(null);
const FIL = { 'Book this court': 'I-book ang court', 'Home': 'Home', 'Help': 'Tulong', 'Log out': 'Mag-log out', 'You are booked': 'Naka-book ka na', 'Try again': 'Subukan muli', 'Notifications': 'Mga abiso', 'More': 'Higit pa', 'Search': 'Maghanap', 'Cancel': 'Kanselahin', 'Save changes': 'I-save ang mga pagbabago', 'Book Now': 'Mag-book na' };
export function PrefsProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('dn_dark') === '1' || (localStorage.getItem('dn_dark') === null && matchMedia('(prefers-color-scheme: dark)').matches));
  const [large, setLarge] = useState(() => localStorage.getItem('dn_large') === '1');
  const [lang, setLang] = useState(() => localStorage.getItem('dn_lang') || 'en');
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('dn_dark', dark ? '1' : '0'); }, [dark]);
  useEffect(() => { document.documentElement.dataset.large = String(large); localStorage.setItem('dn_large', large ? '1' : '0'); }, [large]);
  useEffect(() => { document.documentElement.lang = lang === 'fil' ? 'fil' : 'en'; localStorage.setItem('dn_lang', lang); }, [lang]);
  const t = s => (lang === 'fil' && FIL[s]) || s;
  return <Ctx.Provider value={{ dark, setDark, large, setLarge, lang, setLang, t }}>{children}</Ctx.Provider>;
}
export const usePrefs = () => useContext(Ctx);
