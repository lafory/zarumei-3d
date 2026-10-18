"""Rebuild the brand logo so the gold letters read 'LA FORY' (the original art said 'LA FURY').
Steps: erase the old gold letters (keep the bear's blue shoes), render new gold 3D letters in a
heavy condensed sans font with an extruded side, bevel and grain, and composite them BEHIND the shoes.
Usage: python3 scripts/make_logo.py <original.jpg> <out_dir>"""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

src, out = sys.argv[1], sys.argv[2]
FONT = '/usr/share/fonts/truetype/sand-box/google/Anton/Anton-Regular.ttf'
im = Image.open(src).convert('RGB'); W, H = im.size           # 1500 x 1500
a = np.asarray(im).astype(np.float32) / 255
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mx, mn = a.max(-1), a.min(-1); sat = (mx - mn) / (mx + 1e-6)
Y0 = 1075                                                     # top of the old lettering
yy = np.arange(H)[:, None] * np.ones((1, W))
# bear pixels inside the letter zone: blue-dominant or bright grey sparkle near blue
blue = (b > r + 0.04) & (b > g - 0.02) & (mx > 0.12)
blueImg = Image.fromarray((blue * 255).astype('uint8')).filter(ImageFilter.MaxFilter(15))
nearBlue = np.asarray(blueImg) > 0
sparkle = (sat < 0.22) & (mx > 0.30) & nearBlue
bear = blue | sparkle
# clean: close small holes inside the shoes
bm = Image.fromarray((bear * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
bear = np.asarray(bm) > 0
zone = yy >= Y0
keep = ~zone | bear
base = (a * keep[..., None])
# extend canvas downwards so the new letters can be full height
NH = 1640
canvas = np.zeros((NH, W, 3), np.float32); canvas[:H] = base
bearMask = np.zeros((NH, W), bool); bearMask[:H] = zone & bear
# shoe sole bottom (lowest blue row in zone)
rows = np.where(bearMask.any(1))[0]; sole = rows.max()
print('sole bottom y =', sole)

# ── new lettering ──
text = 'LA FORY'
LH = 360                                                     # cap height in px (original ≈ 340)
font = ImageFont.truetype(FONT, int(LH * 1.09))
tmp = Image.new('L', (W * 2, NH)); d = ImageDraw.Draw(tmp)
bbox = d.textbbox((0, 0), text, font=font)
print('text bbox', bbox)
mask = Image.new('L', (W, NH)); d = ImageDraw.Draw(mask)
tw = bbox[2] - bbox[0]; th = bbox[3] - bbox[1]
spacing = 18
# draw letter by letter with a little tracking
xs = []; x = 0
for ch in text:
    w = d.textlength(ch, font=font); xs.append(x); x += w + (spacing if ch != ' ' else -40)
total = x - spacing
top = sole - 70                                              # the soles rest on (overlap) the top of the letters
x0 = (W - total) / 2 + 10
for ch, xx in zip(text, xs):
    d.text((x0 + xx - bbox[0], top - bbox[1]), ch, font=font, fill=255)
mk = np.asarray(mask).astype(np.float32) / 255
ys, xs_ = np.where(mk > 0.5); print('letters y', ys.min(), ys.max(), 'x', xs_.min(), xs_.max())

# extrusion (side faces): stack offset copies going down-left, darker as they go back
DEPTH = 26
side = np.zeros_like(mk); sideShade = np.zeros_like(mk)
for k in range(DEPTH, 0, -1):
    sh = np.roll(np.roll(mk, k, axis=0), -int(k * 0.45), axis=1)
    newpix = sh > side
    sideShade = np.where(newpix, k / DEPTH, sideShade); side = np.maximum(side, sh)
sideOnly = np.clip(side - mk, 0, 1)
# front face: gold gradient + bevel (lighter top-left edge, darker bottom-right edge) + matte grain
ygrid = (np.arange(NH)[:, None] - ys.min()) / (ys.max() - ys.min() + 1)
gold_top = np.array([0.93, 0.74, 0.30]); gold_bot = np.array([0.62, 0.43, 0.12])
front = gold_top[None, None] * (1 - ygrid[..., None]) + gold_bot[None, None] * ygrid[..., None]
front = np.broadcast_to(front, (NH, W, 3)).copy()
mimg = Image.fromarray((mk * 255).astype('uint8'))
inner = np.asarray(mimg.filter(ImageFilter.MinFilter(9))).astype(np.float32) / 255
bevel = np.clip(mk - inner, 0, 1)
up = np.roll(np.roll(mk, 5, 0), 5, 1)             # pixels whose up-left neighbour is empty → highlight
hl = bevel * (1 - up); dk = bevel * up
front *= (1 + 0.30 * hl[..., None] - 0.28 * dk[..., None])
rng = np.random.default_rng(7)
grain = Image.fromarray((rng.random((NH, W)) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.2))
grain = (np.asarray(grain).astype(np.float32) / 255 - 0.5) * 0.10
front *= (1 + grain[..., None])
sideCol = np.array([0.42, 0.27, 0.06])[None, None] * (1.05 - 0.55 * sideShade[..., None])
# ground shadow
shadow = np.asarray(Image.fromarray((side * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(18))).astype(np.float32) / 255
shadow = np.roll(shadow, 14, 0) * 0.6

out_img = canvas.copy()
notBear = ~bearMask
L = notBear[..., None]
out_img = np.where(L, out_img * (1 - shadow[..., None] * 0.0), out_img)
sideA = (sideOnly * notBear)[..., None]; frontA = (mk * notBear)[..., None]
out_img = out_img * (1 - sideA) + sideCol * sideA
out_img = out_img * (1 - frontA) + front * frontA
# soft contact shadow of the shoes on the letter tops
shoe = np.asarray(Image.fromarray((bearMask * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(10))).astype(np.float32) / 255
shoeShadow = np.roll(shoe, 10, 0) * notBear * (mk > 0.1)
out_img *= (1 - 0.45 * shoeShadow[..., None])
res = Image.fromarray((np.clip(out_img, 0, 1) * 255).astype('uint8'))
res.save(out + '/lafory-master.png')
print('saved', res.size)
