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

import { getThemeExitDuration, playExitGhost } from './exit_ghost';

describe('exit_ghost', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  test('getThemeExitDuration is 0 when the theme does not set it', () => {
    const node = document.createElement('div');
    document.body.appendChild(node);
    expect(getThemeExitDuration(node, '--ouiFlyoutExitDuration')).toBe(0);
    expect(getThemeExitDuration(null, '--ouiFlyoutExitDuration')).toBe(0);
  });

  test('getThemeExitDuration reads the custom property', () => {
    const node = document.createElement('div');
    node.style.setProperty('--ouiFlyoutExitDuration', '150');
    document.body.appendChild(node);
    expect(getThemeExitDuration(node, '--ouiFlyoutExitDuration')).toBe(150);
  });

  test('playExitGhost does nothing for a 0 duration', () => {
    const node = document.createElement('div');
    node.innerHTML = '<span>content</span>';
    expect(playExitGhost(node, 0, 'x-isClosing')).toBe(false);
    expect(document.body.children.length).toBe(0);
  });

  test('playExitGhost leaves an inert, hidden copy and removes it', () => {
    jest.useFakeTimers();
    const node = document.createElement('div');
    node.id = 'real';
    node.innerHTML = '<button id="inner">Close</button>';
    expect(playExitGhost(node, 150, 'x-isClosing')).toBe(true);

    const ghost = document.body.querySelector('.x-isClosing') as HTMLElement;
    expect(ghost).not.toBeNull();
    expect(ghost.getAttribute('aria-hidden')).toBe('true');
    expect(ghost.hasAttribute('inert')).toBe(true);
    expect(ghost.style.pointerEvents).toBe('none');
    expect(document.querySelectorAll('[id]').length).toBe(0);

    jest.advanceTimersByTime(150);
    expect(document.body.querySelector('.x-isClosing')).toBeNull();
  });
});
