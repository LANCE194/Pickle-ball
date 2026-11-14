import { colors } from '../theme/tokens.js';

const DEEP_INK = '#06172D';

function luminance(hex) {
  const values = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(value =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

export function contrastRatio(first, second) {
  if (!/^#[0-9a-f]{6}$/i.test(first || '') || !/^#[0-9a-f]{6}$/i.test(second || '')) return 1;
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

export function readableTextColor(background) {
  const candidates = [colors.navy, colors.offwhite, DEEP_INK];
  return candidates.find(color => contrastRatio(background, color) >= 4.5)
    || candidates.reduce((best, color) => contrastRatio(background, color) > contrastRatio(background, best) ? color : best);
}

export function accessibleColor(color, background, fallback) {
  if (contrastRatio(color, background) >= 4.5) return color;
  if (contrastRatio(fallback, background) >= 4.5) return fallback;
  return readableTextColor(background);
}
