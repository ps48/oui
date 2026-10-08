/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import {
  getThemePaletteColorBlind,
  ouiPaletteColorBlind,
} from './oui_palettes';

const THEMED = [
  '#8A3FFC',
  '#33B1FF',
  '#007D79',
  '#FF7EB6',
  '#FA4D56',
  '#FFF1F1',
  '#6FDC8C',
  '#4589FF',
  '#D12771',
  '#D2A106',
];

describe('ouiPaletteColorBlind theme override', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--ouiPaletteColorBlind');
  });

  test('keeps the classic palette when the theme sets nothing', () => {
    expect(getThemePaletteColorBlind()).toBeUndefined();
    expect(ouiPaletteColorBlind()[0]).toBe('#54B399');
    expect(ouiPaletteColorBlind()).toHaveLength(10);
  });

  test('uses the theme base colors when set', () => {
    document.documentElement.style.setProperty(
      '--ouiPaletteColorBlind',
      THEMED.join(', ').toLowerCase()
    );
    expect(ouiPaletteColorBlind()).toEqual(THEMED);
    expect(ouiPaletteColorBlind({ rotations: 2 })).toHaveLength(20);
  });

  test('ignores a malformed value', () => {
    document.documentElement.style.setProperty(
      '--ouiPaletteColorBlind',
      '#123456, nope'
    );
    expect(ouiPaletteColorBlind()[0]).toBe('#54B399');
  });
});
