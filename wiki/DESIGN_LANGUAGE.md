# OUI AMOLED design language

The `amoled-dark` and `amoled-light` themes are an additive theme family. The classic `oui` themes do not import any of these files, so their output is unchanged. Every change lives under `src/themes/oui-amoled/` plus the two entrypoints `src/theme_amoled_dark.scss` and `src/theme_amoled_light.scss`.

## Principles

1. Data carries the visual weight. Chrome is quiet: low-contrast 1px borders, soft shadows, no gradients.
2. One curve everywhere. A single radius scale, and composite controls (input groups, button groups) are clipped so every corner is the same curve.
3. Motion confirms, never decorates. Short, ease-out, no overshoot, and none at all under `prefers-reduced-motion: reduce`.
4. Token contract preserved. Only values change; no variable is renamed or removed, so OSD and plugins that read `$oui*` / `$eui*` keep compiling.
5. The base size unit (`$ouiSize`, 16px) is not changed, because OSD layout code computes offsets from it.

## Import order (why each file sits where it does)

| File | Position | Mechanism |
|---|---|---|
| `oui_amoled_colors_dark.scss` / `_light` | before `global_styling` | predefines `!default` color tokens |
| `oui_amoled_shape.scss` | before `global_styling` | predefines `!default` radius, motion speed, form and panel-padding tokens |
| `oui_amoled_viz.scss` | after `global_styling` | overrides the `$ouiColorVis*` values derived from the colorblind palette map |
| `oui_amoled_elevation.scss` | after `global_styling`, before components | redefines the shadow mixins; Sass resolves a mixin at `@include` time |
| `oui_amoled_components.scss` | after components | targeted rules that win by source order |
| `oui_amoled_motion.scss` | after components | keyframes and transitions |

## Color

- Dark: page `#000000`, panels `#0A0A0F`, raised surfaces `#15161B`, borders `#23242B`. Panels float on true black; borders, not shadows, separate surfaces.
- Light: OUI's default light palette, unchanged except where the shared shape, elevation, density and motion layers apply.
- Shadows stay pure black so elevation still reads on near-black surfaces.
- `color-scheme` follows the theme, so native widgets (number spinners, date pickers, scrollbars) are not bright OS-default boxes in dark mode.

## Data visualization

The 16-stop `$ouiColorVis0..15` ramp is a magma-style sequential ramp from plum to warm white, tuned for the `#0A0A0F` surface. `scripts/validate-amoled-viz.py` reads the stops from source and checks:

- contrast of every stop against `#0A0A0F` is at least 1.6:1;
- luminance strictly increases, which keeps the ramp orderable under any color-vision deficiency;
- adjacent stops differ by CIELAB delta-E of at least 5 under normal vision and simulated protanopia, deuteranopia and tritanopia (Machado et al. 2009).

Run it with `python3 scripts/validate-amoled-viz.py`; it exits non-zero on failure.

## Shape

| Token | Classic | AMOLED |
|---|---|---|
| `$ouiBorderRadius` | 4px | 8px |
| `$ouiBorderRadiusSmall` | 2px | 5px |
| `$ouiFormControlBorderRadius` | 0 | 6px |
| `$ouiFormControlCompressedBorderRadius` | 2px | 5px |
| `$ouiFormControlBoxShadow` | bottom-only drop shadow | none (even 1px ring) |

Input groups clip their prepend/append children to the group radius. Focus is a ring that follows the radius (1px primary border plus a 3px translucent halo) instead of OUI's square-cut 2px bottom underline. Badges use the small radius; the selected-tab underline has rounded ends.

## Elevation

Two soft layers with negative spread replace OUI's 4-6 hard layers (Tailwind `shadow-sm` to `shadow-xl`):

| Mixin | AMOLED value |
|---|---|
| `ouiSlightShadow` | `0 1px 2px 0` |
| `ouiBottomShadowSmall`, `ouiSlightShadowHover` | `0 1px 3px 0`, `0 1px 2px -1px` |
| `ouiBottomShadowMedium` | `0 4px 6px -1px`, `0 2px 4px -2px` |
| `ouiBottomShadow` | `0 10px 15px -3px`, `0 4px 6px -4px` |
| `ouiBottomShadowLarge` | `0 20px 25px -5px`, `0 8px 10px -6px` |

Empty (ghost) buttons carry no resting shadow.

## Density

Cozy, by container padding only:

- Panel padding small / medium / large: 12 / 20 / 32px (classic 8 / 16 / 24). Cards inherit the medium value.
- Non-compressed table cells: 10px vertical, 12px horizontal, with a subtle primary-tinted row hover. Compressed tables are unchanged.

## Motion

- Easing: in `cubic-bezier(.16, 1, .3, 1)`, out `cubic-bezier(.7, 0, .84, 0)`. No bounce.
- Speeds: fast 120ms, normal 200ms.

| Component | Enter | Exit |
|---|---|---|
| Modal | fade + zoom from 95%, 200ms | none (see below) |
| Overlay mask | fade, 200ms | none |
| Popover, context menu | fade + zoom from 96% on top of OUI's offset slide, 200ms | same in reverse, 120ms |
| Tooltip | fade + zoom, 120ms | none (OUI unmounts on hide) |
| Flyout | side slide, smooth curve | none |
| Toast | OUI slide-in | OUI fade-out |

Modal and flyout exits are not implemented: consumers mount them conditionally (`{isOpen && <OuiModal />}`), so the component never observes its own close. An exit animation needs a new prop-driven API and is a component change, not a theme change.

Under `prefers-reduced-motion: reduce` all of the above are disabled; state is shown by presence and opacity only.

## Not in scope

- Component API or markup changes.
- Hardcoded colors inside OSD plugins. These are tracked separately as a seam audit, because they do not follow any OUI theme.
