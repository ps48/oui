#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
#
# The OpenSearch Contributors require contributions made to
# this file be licensed under the Apache-2.0 license or a
# compatible open source license.
"""Validate the AMOLED data-viz ramp (stdlib only).

Reads the 16 `$ouiColorVisN` graphic stops straight from
src/themes/oui-amoled/oui_amoled_viz.scss, so the check can never drift from
the shipped values, and asserts:

1. Every stop has contrast >= 1.6:1 against the AMOLED panel (#0A0A0F), so a
   mark is never lost in the background (non-text graphic floor used here;
   WCAG's 3:1 applies to text-adjacent UI, not dense chart fills).
2. Luminance is strictly increasing stop to stop. This is what keeps a
   sequential ramp orderable under every color-vision deficiency, because CVD
   removes hue information but not lightness.
3. Adjacent stops stay distinguishable (CIELAB delta-E 1976 >= 5) under normal
   vision and simulated protanopia, deuteranopia and tritanopia (Machado et al.
   2009, severity 1.0). 5 is roughly two just-noticeable differences.

Exit code 0 on pass, 1 on any failure.
"""

import math
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIZ = ROOT / "src/themes/oui-amoled/oui_amoled_viz.scss"
SURFACE = "#0A0A0F"
MIN_CONTRAST = 1.6
MIN_DELTA_E = 5.0

# Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear RGB.
CVD = {
    "protan": ((0.152286, 1.052583, -0.204868),
               (0.114503, 0.786281, 0.099216),
               (-0.003882, -0.048116, 1.051998)),
    "deutan": ((0.367322, 0.860646, -0.227968),
               (0.280085, 0.672501, 0.047413),
               (-0.011820, 0.042940, 0.968881)),
    "tritan": ((1.255528, -0.076749, -0.178779),
               (-0.078411, 0.930809, 0.147602),
               (0.004733, 0.691367, 0.303900)),
}


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(lin):
    r, g, b = lin
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(l1, l2):
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def simulate(lin, matrix):
    return tuple(min(1.0, max(0.0, sum(m * c for m, c in zip(row, lin))))
                 for row in matrix)


def lab(lin):
    r, g, b = lin
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 1.0
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883

    def f(t):
        return t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116

    fx, fy, fz = f(x), f(y), f(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def delta_e(a, b):
    return math.sqrt(sum((p - q) ** 2 for p, q in zip(lab(a), lab(b))))


def load_ramp():
    text = VIZ.read_text()
    stops = re.findall(r"^\$ouiColorVis(\d+):\s*(#[0-9A-Fa-f]{6})\s*;", text, re.M)
    stops = sorted((int(i), h) for i, h in stops)
    if [i for i, _ in stops] != list(range(16)):
        sys.exit(f"expected $ouiColorVis0..15 in {VIZ}, found {[i for i, _ in stops]}")
    return [h for _, h in stops]


def main():
    ramp = load_ramp()
    lins = [tuple(to_linear(c) for c in hex_to_rgb(h)) for h in ramp]
    surface = luminance(tuple(to_linear(c) for c in hex_to_rgb(SURFACE)))
    failures = []

    contrasts = [contrast(luminance(l), surface) for l in lins]
    for i, c in enumerate(contrasts):
        if c < MIN_CONTRAST:
            failures.append(f"stop {i} {ramp[i]}: contrast {c:.2f} < {MIN_CONTRAST}")

    lums = [luminance(l) for l in lins]
    for i in range(1, 16):
        if lums[i] <= lums[i - 1]:
            failures.append(f"stops {i - 1}->{i}: luminance not increasing")

    worst = {}
    for name, matrix in [("normal", None)] + list(CVD.items()):
        seen = [l if matrix is None else simulate(l, matrix) for l in lins]
        for i in range(1, 16):
            d = delta_e(seen[i - 1], seen[i])
            worst[name] = min(worst.get(name, 1e9), d)
            if d < MIN_DELTA_E:
                failures.append(f"{name} stops {i - 1}->{i} "
                                f"({ramp[i - 1]}->{ramp[i]}): dE {d:.1f} < {MIN_DELTA_E}")

    print(f"ramp: {' '.join(ramp)}")
    print(f"min contrast vs {SURFACE}: {min(contrasts):.2f}")
    print("min adjacent dE: " + ", ".join(f"{k} {v:.1f}" for k, v in worst.items()))
    if failures:
        print("FAIL")
        for f in failures:
            print("  " + f)
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
