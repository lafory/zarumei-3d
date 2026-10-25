"""Rosé: limpieza v2 del arte del oso (sin las agujas impresas).
Máscara ajustada a las agujas (color del metal rosa + bandas de cada aguja), relleno por
reconstrucción de frecuencias (OpenCV contrib · xphoto FSR_BEST).
Requiere: pip install opencv-contrib-python-headless pillow numpy
Uso: python scripts/prep_rose_v2.py <foto_rose.jpg> assets/"""
import sys, numpy as np, cv2
from PIL import Image, ImageDraw
src, out = sys.argv[1:3]
im = Image.open(src).convert('RGB').crop((520, 430, 980, 900)); W, H = im.size
a = np.asarray(im).astype(np.int16); C = (226, 233)
def lines(width_h, width_m, width_s, hub):
    m = Image.new('L', im.size, 0); d = ImageDraw.Draw(m)
    d.line([C, (84, 134)], fill=255, width=width_h); d.line([C, (440, 73)], fill=255, width=width_m); d.line([(229, 128), (214, 470)], fill=255, width=width_s)
    d.ellipse([C[0] - hub, C[1] - hub, C[0] + hub, C[1] + hub], fill=255); return np.asarray(m) > 0
band = lines(34, 30, 20, 24)
hsv = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2HSV).astype(np.int16); r, g, b = a[..., 0], a[..., 1], a[..., 2]
metal = (hsv[..., 1] < 110) & (hsv[..., 2] > 120) & (r >= g - 5) & (g >= b - 15)
mask = cv2.morphologyEx((band & metal).astype(np.uint8) * 255, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, lab = cv2.connectedComponents(mask); sk = lines(5, 5, 4, 10); keep = np.zeros_like(mask)
for i in range(1, n):
    if ((lab == i) & sk).any(): keep[lab == i] = 255
keep = cv2.dilate(keep, np.ones((5, 5), np.uint8)); keep[~band] = 0
hub = Image.new('L', im.size, 0); d = ImageDraw.Draw(hub); d.ellipse([C[0] - 27, C[1] - 25, C[0] + 27, C[1] + 25], fill=255); d.line([(229, 128), (214, 470)], fill=255, width=9)
keep = np.maximum(keep, np.asarray(hub))
bgr = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR); dst = np.zeros_like(bgr)
cv2.xphoto.inpaint(bgr, (keep == 0).astype(np.uint8) * 255, dst, cv2.xphoto.INPAINT_FSR_BEST)
rgb = cv2.cvtColor(dst, cv2.COLOR_BGR2RGB).astype(np.int16)
# (los restos sobre la laca blanca quedan casi blancos y se vuelven transparentes abajo)
art = Image.fromarray(np.clip(rgb, 0, 255).astype('uint8'))
art.save('/tmp/rose_v2_art.png')
# laca blanca → transparente (el juego pinta su propia esfera) — igual que prep_dials.py
def floodAlpha(img, key):
    aa = np.asarray(img.convert('RGB')).astype(np.float32) / 255; bgc = key(aa)
    m = Image.fromarray(np.where(bgc, 128, 255).astype('uint8')).copy(); w, h = m.size
    for x in range(0, w, 9):
        for y in (0, h - 1):
            if m.getpixel((x, y)) == 128: ImageDraw.floodfill(m, (x, y), 0)
    for y in range(0, h, 9):
        for x in (0, w - 1):
            if m.getpixel((x, y)) == 128: ImageDraw.floodfill(m, (x, y), 0)
    return np.asarray(m) != 0
al = floodAlpha(art, lambda q: (q.min(-1) > 0.80) & ((q.max(-1) - q.min(-1)) < 0.10))
yy, xx = np.mgrid[0:H, 0:W]; al = al & ~((xx < 22) | (xx > W - 22) | (yy < 18) | (yy > H - 18))
al = cv2.morphologyEx(al.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n2, lab2, stt, _ = cv2.connectedComponentsWithStats(al)
for i in range(1, n2):
    if stt[i, cv2.CC_STAT_AREA] < 400: al[lab2 == i] = 0  # restos sueltos sobre la laca
alpha = cv2.GaussianBlur(al, (3, 3), 0)
rgba = art.convert('RGBA'); rgba.putalpha(Image.fromarray(alpha))
rgba = rgba.crop(rgba.getbbox()); print('rose art', rgba.size)
rgba.resize((512, round(512 * rgba.height / rgba.width)), Image.LANCZOS).save(out + '/dial-rose-art.webp', quality=90, method=6)
print('ok')
