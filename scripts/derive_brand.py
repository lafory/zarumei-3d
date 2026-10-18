"""From the LA FORY master (black background) derive: web jpg, transparent png/webp, badge, decals."""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); W, H = im.size
a = np.asarray(im).astype(np.float32) / 255
dark = (a.max(-1) < 0.035)
# flood fill background from the border through dark pixels
m = Image.fromarray(np.where(dark, 128, 255).astype('uint8')).copy()
for x in range(0, W, 25):
    for y in (0, H - 1):
        if m.getpixel((x, y)) == 128: ImageDraw.floodfill(m, (x, y), 0)
for y in range(0, H, 25):
    for x in (0, W - 1):
        if m.getpixel((x, y)) == 128: ImageDraw.floodfill(m, (x, y), 0)
bg = np.asarray(m) == 0
alpha = Image.fromarray(np.where(bg, 0, 255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
rgba = im.convert('RGBA'); rgba.putalpha(alpha)
bbox = alpha.getbbox(); rgba = rgba.crop(bbox); print('content bbox', bbox, rgba.size)
def sized(img, w): return img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
sized(rgba, 1024).save(out + '/lafory-logo.png', optimize=True)
sized(rgba, 1024).save(out + '/lafory-logo.webp', quality=88, method=6)
sized(rgba, 512).save(out + '/lafory-logo-512.webp', quality=86, method=6)
sized(rgba, 512).save(out + '/lafory-logo-512.png', optimize=True)
sized(rgba, 256).save(out + '/lafory-logo-256.png', optimize=True)
sized(rgba, 128).save(out + '/lafory-badge-128.png', optimize=True)
sized(rgba, 128).save(out + '/lafory-badge-128.webp', quality=90, method=6)
# web jpg on black, square 800
sq = Image.new('RGB', (max(rgba.size),) * 2, (0, 0, 0)); sq.paste(rgba, ((sq.width - rgba.width) // 2, (sq.height - rgba.height) // 2), rgba)
sq.resize((800, 800), Image.LANCZOS).save(out + '/lafory-logo.jpg', quality=86, optimize=True, progressive=True)
# decals: luminance-tinted monochrome
lum = np.asarray(rgba.convert('L')).astype(np.float32) / 255
al = np.asarray(rgba.split()[3])
def tint(c0, c1, gamma=0.8):
    l = lum ** gamma
    rgb = (np.array(c0)[None, None] * (1 - l[..., None]) + np.array(c1)[None, None] * l[..., None])
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), al]).astype('uint8'), 'RGBA')
gold = tint((92, 62, 16), (246, 214, 140)); white = tint((150, 150, 150), (255, 255, 255), 0.6)
sized(gold, 512).save(out + '/lafory-decal-engrave-gold.png', optimize=True)
sized(gold, 256).save(out + '/lafory-decal-engrave-gold-256.webp', quality=88, method=6)
sized(white, 512).save(out + '/lafory-decal-print-white.png', optimize=True)
sized(white, 256).save(out + '/lafory-decal-print-white-256.webp', quality=88, method=6)
print('ok')
