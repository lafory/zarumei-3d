"""Imagen Open Graph 1200×630: render del reloj + logo LA FORY + título. Uso: python3 scripts/make_og.py <render.png>"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont
for n in ['cinzel', 'cormorant-italic']:
    f = TTFont(f'fonts/{n}.woff2'); f.flavor = None; f.save(f'/tmp/{n}.ttf')
W, H = 1200, 630; og = Image.new('RGB', (W, H), (10, 9, 8))
r = Image.open(sys.argv[1]).convert('RGB'); s = H / r.height; r = r.resize((int(r.width * s), H), Image.LANCZOS)
r = r.crop(((r.width - 640) // 2, 0, (r.width - 640) // 2 + 640, H))
mask = Image.new('L', r.size, 255); md = ImageDraw.Draw(mask)
for x in range(140): md.line([(640 - 140 + x, 0), (640 - 140 + x, H)], fill=int(255 * (1 - x / 140)))
og.paste(r, (0, 0), mask)
logo = Image.open('assets/lafory-logo.png').convert('RGBA'); lh = 300; logo = logo.resize((int(logo.width * lh / logo.height), lh), Image.LANCZOS)
og.paste(logo, (640 + (560 - logo.width) // 2, 50), logo)
d = ImageDraw.Draw(og); gold = (217, 180, 94)
f1 = ImageFont.truetype('/tmp/cinzel.ttf', 54); f2 = ImageFont.truetype('/tmp/cormorant-italic.ttf', 34); f3 = ImageFont.truetype('/tmp/cinzel.ttf', 20)
def ctext(y, t, f, c): w = d.textlength(t, font=f); d.text((640 + (560 - w) / 2, y), t, font=f, fill=c)
ctext(375, 'ZARUMEI 3D', f1, gold); ctext(445, 'Atelier de relojería · simulador 3D', f2, (239, 230, 211))
d.line([(760, 500), (1080, 500)], fill=gold, width=1); ctext(520, 'MAISON LA FORY · TOOLS & JEWELRY', f3, gold)
og.save('og.jpg', quality=88); print('og.jpg')
