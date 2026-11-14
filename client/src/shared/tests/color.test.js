import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessibleColor, contrastRatio, readableTextColor } from '../lib/color.js';
import { colors, slotColors } from '../theme/tokens.js';

test('shared brand and slot tokens match the approved design palette', () => {
  assert.deepEqual(colors, {
    court: '#0B6E4F',
    volt: '#C6F432',
    navy: '#0B1F3A',
    blue: '#1E88E5',
    clay: '#FF7A1A',
    offwhite: '#F6F8F5',
    slate: '#5B6B7A',
    alert: '#E5484D',
  });
  assert.deepEqual(slotColors, {
    available: colors.blue,
    pending: colors.clay,
    confirmed: colors.court,
    blocked: colors.slate,
    cancelled: colors.alert,
    rejected: colors.alert,
    past: colors.slate,
  });
});

test('site palette text colors keep readable contrast for light and dark accents', () => {
  assert.equal(readableTextColor('#C6F432'), '#0B1F3A');
  assert.equal(readableTextColor('#0B6E4F'), '#F6F8F5');
  assert.ok(contrastRatio(readableTextColor('#0B6E4F'), '#0B6E4F') >= 4.5);
  assert.equal(accessibleColor('#0B6E4F', '#F6F8F5', '#0B1F3A'), '#0B6E4F');
  assert.equal(accessibleColor('#C6F432', '#0B1F3A', '#F6F8F5'), '#C6F432');
});

test('accessibleColor falls back to readable ink when both supplied colors fail contrast', () => {
  const background = '#DDE6E0';
  const color = accessibleColor('#C6F432', background, '#C6F432');
  assert.ok(contrastRatio(color, background) >= 4.5);
});

test('solid brand status colors choose text with WCAG AA contrast', () => {
  for (const background of [...Object.values(slotColors), colors.alert]) {
    assert.ok(contrastRatio(readableTextColor(background), background) >= 4.5, `${background} needs readable text`);
  }
  assert.equal(readableTextColor(colors.alert), '#06172D');
  assert.ok(contrastRatio('#06172D', colors.alert) >= 4.5);
});
