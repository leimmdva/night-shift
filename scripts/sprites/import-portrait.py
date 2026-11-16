#!/usr/bin/env python3
"""One-off importer: turns the owner's hand-drawn portrait scan into the text-grid source
scripts/sprites/src/portraits/player.txt (then `npm run build-portraits` makes the PNG).

Steps: 1) read the grid the art was drawn on (one art pixel = about 12.22 x 12.33 screen px, found by
fitting edge positions), 2) sample the median colour of the middle half of every cell (nearest-neighbour
style, no blending), 3) drop the grey floor shadow, 4) merge near-identical colours (scan noise) into a
flat palette, 5) trim to the figure with a 2px margin, 6) write the text grid.
Needs Python 3 with numpy and Pillow. Usage: python3 scripts/sprites/import-portrait.py
"""
import sys, os
from collections import Counter
import numpy as np
from PIL import Image

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = os.path.join(root, 'docs/art/source/owner-player-portrait.png')
OUT = os.path.join(root, 'scripts/sprites/src/portraits/player.txt')
PX, PY = 12.22, 12.33            # measured cell size in the scan
BOX = (423, 149, 872, 1075)      # figure bounds in the scan (x0, y0, x1, y1), includes the floor shadow
MERGE = 34                       # colours closer than this (RGB distance) are the same palette colour
SHADOW = np.array([0x9c, 0x8c, 0x98])

im = np.array(Image.open(SRC).convert('RGBA')).astype(float)
ox, oy = BOX[0] + 11.5 - PX, BOX[1] + 11.0 - PY
W, H = int((BOX[2] - ox) // PX) + 1, int((BOX[3] - oy) // PY) + 1
r = np.zeros((H, W, 4), int)
for j in range(H):
    for i in range(W):
        x0, y0 = ox + i * PX, oy + j * PY
        c = im[max(0, int(y0 + PY * .25)):max(1, int(y0 + PY * .75)), max(0, int(x0 + PX * .25)):max(1, int(x0 + PX * .75))].reshape(-1, 4)
        if np.median(c[:, 3]) < 128: continue
        c = c[c[:, 3] > 128]
        r[j, i] = [*np.median(c[:, :3], axis=0), 255]
shadow = (r[..., 3] > 0) & (np.abs(r[..., :3] - SHADOW).sum(2) < 45)
shadow[:70] = False
r[shadow] = 0
ys, xs = np.where(r[..., 3] > 0)
r = r[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
alpha = r[..., 3] > 0

u, cnt = np.unique(r[alpha][:, :3], axis=0, return_counts=True)
centers, members = [], []
for i in np.argsort(-cnt):
    c = u[i]
    if centers:
        d = np.sqrt(((np.array(centers) - c) ** 2).sum(1)); j = d.argmin()
        if d[j] < MERGE: members[j].append((c, cnt[i])); continue
    centers.append(c.astype(float)); members.append([(c, cnt[i])])
pal = np.array([np.average([m[0] for m in ms], axis=0, weights=[m[1] for m in ms]) for ms in members]).round().astype(int)
idx = ((r[..., None, :3] - pal[None, None]) ** 2).sum(-1).argmin(-1)

used = Counter(idx[alpha].tolist())
outline = min(used, key=lambda k: int(pal[k].sum()))           # darkest colour is the outline
order = [outline] + [k for k, _ in used.most_common() if k != outline]
chars = 'oabcdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
ch = {k: chars[n] for n, k in enumerate(order)}
rows = [''.join(ch[idx[y, x]] if alpha[y, x] else '.' for x in range(alpha.shape[1])) for y in range(alpha.shape[0])]
m = 2                                                           # 2px transparent margin
rows = ['.' * (len(rows[0]) + 2 * m)] * m + ['.' * m + row + '.' * m for row in rows] + ['.' * (len(rows[0]) + 2 * m)] * m
head = [f'@ {ch[k]} #{pal[k][0]:02x}{pal[k][1]:02x}{pal[k][2]:02x}' for k in order]
open(OUT, 'w').write('\n'.join(head + ['---'] + rows) + '\n')
print(f'wrote {OUT}: {len(rows[0])}x{len(rows)} art pixels, {len(order)} colours')
