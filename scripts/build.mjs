// Build: incrusta las imágenes como data URI (para que funcione también desde file://,
// donde WebGL no acepta imágenes locales) y empaqueta todo en game.js con esbuild.
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
const A = new URL('../assets/', import.meta.url);
const files = {
  dial: ['dial-miami.jpg', 'image/jpeg'],
  logo: ['lafury-logo-512.webp', 'image/webp'],
  badge: ['lafury-badge-128.webp', 'image/webp'],
  decalGold: ['lafury-decal-engrave-gold-256.webp', 'image/webp'],
  decalWhite: ['lafury-decal-print-white-256.webp', 'image/webp']
};
let out = '// GENERADO por scripts/build.mjs — no editar\nexport const IMG = {\n';
for (const [k, [f, mime]] of Object.entries(files)) out += `  ${k}: 'data:${mime};base64,${readFileSync(new URL(f, A)).toString('base64')}',\n`;
writeFileSync(new URL('../src/assets-inline.js', import.meta.url), out + '};\n');
await build({ entryPoints: [new URL('../src/main.js', import.meta.url).pathname], bundle: true, minify: true, format: 'iife', target: ['es2020', 'safari15'], outfile: new URL('../game.js', import.meta.url).pathname, legalComments: 'eof' });
console.log('OK → game.js');
