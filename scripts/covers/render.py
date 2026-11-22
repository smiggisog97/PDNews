"""Abstract monochrome cover images for the brief page.

Domain-warped light fields with soft film grain, in the neutral ramp only.
Run once: python3 scripts/covers/render.py  (writes public/covers/abstract-*.webp)
"""
import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path

W, H = 2400, 1200
OUT = Path(__file__).resolve().parents[2] / "public" / "covers"
OUT.mkdir(parents=True, exist_ok=True)

def field(seed):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    x /= W; y /= H
    # two passes of domain warping over a sum of soft sines
    def waves(u, v, n, scale):
        out = np.zeros_like(u)
        for _ in range(n):
            a = rng.uniform(0, np.pi * 2); f = rng.uniform(0.6, 1.6) * scale
            out += np.sin((u * np.cos(a) + v * np.sin(a)) * f * np.pi * 2 + rng.uniform(0, 6.28))
        return out / n
    wx = waves(x, y, 4, 1.2); wy = waves(x, y, 4, 1.2)
    u = x + 0.35 * wx; v = y + 0.35 * wy
    wx2 = waves(u, v, 3, 2.0); wy2 = waves(u, v, 3, 2.0)
    u2 = u + 0.18 * wx2; v2 = v + 0.18 * wy2
    f = waves(u2, v2, 5, 1.6)
    # ribbons of light: sharpen into silky folds
    ribbons = np.exp(-((f * 3.2) ** 2))
    base = 0.5 + 0.5 * f
    lum = 0.55 * ribbons + 0.25 * base
    # light falls from one corner
    cx, cy = rng.uniform(0.2, 0.8), rng.uniform(0.0, 0.35)
    fall = np.exp(-(((x - cx) * 1.3) ** 2 + ((y - cy) * 1.6) ** 2) * 2.2)
    lum = lum * (0.35 + 0.95 * fall)
    lum = np.clip(lum, 0, 1) ** 1.35
    return lum

for i, seed in enumerate([7, 21, 42, 88, 135, 233, 377]):
    lum = field(seed)
    img = Image.fromarray((lum * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(1.2))
    a = np.asarray(img).astype(np.float32) / 255
    grain = np.random.default_rng(seed + 1).normal(0, 0.035, a.shape).astype(np.float32)
    a = np.clip(a + grain, 0, 1)
    # map into the neutral ramp: near-black to #EDEDED
    a = 0.02 + a * (0.93 - 0.02)
    Image.fromarray((a * 255).astype(np.uint8), "L").convert("RGB").save(OUT / f"abstract-{i + 1}.webp", quality=82)
    print("wrote", OUT / f"abstract-{i + 1}.webp")
