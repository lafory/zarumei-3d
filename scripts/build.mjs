// Build: incrusta las imágenes como data URI (para que funcione también desde file://,
// donde WebGL no acepta imágenes locales) y empaqueta todo en game.js con esbuild.
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
const A = new URL('../assets/', import.meta.url);
const files = {
  dial: ['dial-miami.jpg', 'image/jpeg'],
  logo: ['lafory-logo-512.webp', 'image/webp'],
  badge: ['lafory-badge-128.webp', 'image/webp'],
  decalGold: ['lafory-decal-engrave-gold-256.webp', 'image/webp'],
  decalWhite: ['lafory-decal-print-white-256.webp', 'image/webp'],
  cubaBear: ['dial-cuba-bear.webp', 'image/webp'],
  roseArt: ['dial-rose-art.webp', 'image/webp'],
  fiesta: ['dial-fiesta.jpg', 'image/jpeg'],
  cosmos: ['dial-cosmos.jpg', 'image/jpeg'],
  hoja: ['dial-hoja.jpg', 'image/jpeg'],
  marte: ['dial-marte.jpg', 'image/jpeg'],
  mascara: ['dial-mascara.jpg', 'image/jpeg'],
  cuerno: ['dial-cuerno.jpg', 'image/jpeg'],
  onelove: ['dial-onelove.jpg', 'image/jpeg']
};
let out = '// GENERADO por scripts/build.mjs — no editar\nexport const IMG = {\n';
for (const [k, [f, mime]] of Object.entries(files)) out += `  ${k}: 'data:${mime};base64,${readFileSync(new URL(f, A)).toString('base64')}',\n`;
writeFileSync(new URL('../src/assets-inline.js', import.meta.url), out + '};\n');
await build({ entryPoints: [new URL('../src/main.js', import.meta.url).pathname], bundle: true, minify: true, format: 'iife', target: ['es2020', 'safari15'], outfile: new URL('../game.js', import.meta.url).pathname, legalComments: 'eof' });
// fuentes autoalojadas (OFL) incrustadas en fonts.css para que también funcionen desde file://
const F = new URL('../fonts/', import.meta.url);
const faces = [['Cormorant Garamond', 'cormorant.woff2', 'normal', '300 700'], ['Cormorant Garamond', 'cormorant-italic.woff2', 'italic', '300 700'], ['Jost', 'jost.woff2', 'normal', '100 900'], ['Cinzel', 'cinzel.woff2', 'normal', '400 900']];
writeFileSync(new URL('../fonts.css', import.meta.url), faces.map(([fam, f, style, w]) => `@font-face{font-family:"${fam}";src:url(data:font/woff2;base64,${readFileSync(new URL(f, F)).toString('base64')}) format("woff2");font-style:${style};font-weight:${w};font-display:swap}`).join('\n') + '\n');
console.log('OK → game.js + fonts.css');
