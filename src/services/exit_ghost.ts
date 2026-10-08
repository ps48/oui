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

/**
 * Reads a theme-provided exit duration (ms) from a CSS custom property.
 * Themes that do not set the property get 0, which means "no exit animation".
 */
export const getThemeExitDuration = (
  node: Element | null,
  property: string
): number => {
  if (!node || typeof window === 'undefined' || !window.getComputedStyle) {
    return 0;
  }
  const value = parseFloat(
    window.getComputedStyle(node).getPropertyValue(property)
  );
  return isNaN(value) || value < 0 ? 0 : value;
};

/**
 * Plays an exit animation for a node that is about to be removed by React.
 *
 * Consumers usually unmount overlays with `{isOpen && <OuiModal />}`, so the
 * component never gets to render a closing state. Instead, right before the
 * real node leaves the DOM, an inert visual copy is left in `document.body`
 * with `closingClassName` applied, and removed after `duration` ms. The copy
 * is `aria-hidden`, `inert` and ignores pointer events, so it is never
 * focusable or announced, and the real component is already gone.
 *
 * Does nothing (returns false) when `duration` is 0, i.e. for every theme
 * that does not opt in, and when the user prefers reduced motion (themes set
 * the duration only under `prefers-reduced-motion: no-preference`).
 */
export const playExitGhost = (
  node: HTMLElement | null,
  duration: number,
  closingClassName: string
): boolean => {
  if (!node || duration <= 0 || typeof document === 'undefined') return false;
  if (!node.firstElementChild && !node.textContent) return false;

  const ghost = node.cloneNode(true) as HTMLElement;
  ghost.classList.add(closingClassName);
  ghost.setAttribute('aria-hidden', 'true');
  ghost.setAttribute('inert', '');
  ghost.removeAttribute('id');
  ghost.style.pointerEvents = 'none';
  ghost.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  document.body.appendChild(ghost);

  window.setTimeout(() => {
    if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
  }, duration);
  return true;
};
