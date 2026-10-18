"""Prepare dial art for the two new watches from the user's images.
cuba: crop the bear (black bg -> transparent).  rose: crop the bear+ZARUMEI neon art, inpaint the
printed hands out of it (the 3D game draws its own hands) and clean the white dial background."""
import sys, numpy as np
from PIL import Image, ImageDraw
cuba_src, rose_src, out = sys.argv[1:4]
def floodAlpha(img, thr, key):
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255
    bgc = key(a, thr)
    m = Image.fromarray(np.where(bgc, 128, 255).astype('uint8')).copy(); W, H = m.size
    for x in range(0, W, 9):
        for y in (0, H - 1):
            if m.getpixel((x, y)) == 128: ImageDraw.floodfill(m, (x, y), 0)
    for y in range(0, H, 9):
        for x in (0, W - 1):
            if m.getpixel((x, y)) == 128: ImageDraw.floodfill(m, (x, y), 0)
    return np.asarray(m) != 0
# cuba bear
c = Image.open(cuba_src).convert('RGB').crop((381, 8, 1121, 748))
al = floodAlpha(c, 0.05, lambda a, t: a.max(-1) < t)
rgba = c.convert('RGBA'); rgba.putalpha(Image.fromarray((al * 255).astype('uint8')))
rgba.resize((512, 512), Image.LANCZOS).save(out + '/dial-cuba-bear.webp', quality=88, method=6)
# rose art
im = Image.open(rose_src).convert('RGB').crop((520, 430, 980, 900))
m = Image.new('L', im.size, 0); d = ImageDraw.Draw(m); C = (226, 233)
d.line([C, (84, 134)], fill=255, width=30); d.line([C, (440, 73)], fill=255, width=26); d.line([(229, 140), (214, 470)], fill=255, width=17)
d.ellipse([C[0] - 21, C[1] - 21, C[0] + 21, C[1] + 21], fill=255)
mk = np.asarray(m) > 0; a = np.asarray(im).astype(np.float32); o = a.copy()
sm = np.asarray(im.resize((im.width // 64, im.height // 64), Image.BOX).resize(im.size, Image.BILINEAR)).astype(np.float32); o[mk] = sm[mk]
for it in range(1300):
    avg = (np.roll(o, 1, 0) + np.roll(o, -1, 0) + np.roll(o, 1, 1) + np.roll(o, -1, 1)) / 4; o[mk] = avg[mk]
art = Image.fromarray(np.clip(o, 0, 255).astype('uint8'))
# white dial background -> transparent (so the game paints its own lacquer + markers)
def whiteKey(a, t):
    mx, mn = a.max(-1), a.min(-1); return (mn > t) & ((mx - mn) < 0.10)
al = floodAlpha(art, 0.80, whiteKey)
# kill the printed baton markers near the crop border
yy, xx = np.mgrid[0:art.height, 0:art.width]
border = (xx < 22) | (xx > art.width - 22) | (yy < 18) | (yy > art.height - 18)
al = al & ~border
rgba = art.convert('RGBA'); rgba.putalpha(Image.fromarray((al * 255).astype('uint8')))
rgba = rgba.crop(rgba.getbbox()); print('rose art', rgba.size)
rgba.resize((512, round(512 * rgba.height / rgba.width)), Image.LANCZOS).save(out + '/dial-rose-art.webp', quality=88, method=6)
print('ok')
