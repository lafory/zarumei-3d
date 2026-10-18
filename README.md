# ZARUMEI 3D · Taller de Relojería
### por **LA FURY Tools & Jewelry**

Simulador 3D de reparación de relojes para el navegador del celular (iPhone/Android), hecho con **Three.js**.
El reloj es el **ZARUMEI Oro "Miami"**: un diseño propio, procedural, en oro, con la esfera del oso Miami (el 12 arriba).
Por dentro lleva el **calibre ZR-28**, cuya arquitectura sigue la de los calibres ETA 2824-2 y Sellita SW200-1:
Ø 25,6 mm, 4 Hz y el orden de piezas de la documentación técnica del fabricante.
Todos los textos del juego están en español.

## Jugar

- **Sin servidor:** abre `index.html` directo en el navegador. Funciona desde `file://` porque las imágenes van incrustadas en `game.js`.
- **Con servidor local:** `python3 -m http.server 8080` y luego abre `http://localhost:8080`. Desde el celular en la misma red Wi-Fi, abre `http://IP-de-tu-compu:8080`.

**Controles táctiles**
- **1 dedo:** girar la vista.
- **2 dedos:** zoom.
- **Toque corto:** usar la herramienta elegida sobre una pieza.
- **↻ Voltear:** dar vuelta el reloj.
- **💡 Pista:** ilumina la herramienta y la pieza correctas (cuesta 2 puntos).

## Casos (definidos como datos en `src/cases.js`)

1. **Caso 1 · "Se atrasa"** (16 pasos):
   1. Timegrapher (−52 s/día, 188°).
   2. Brújula (descarta el magnetismo; el desmagnetizador es opcional).
   3. Fondo roscado (con llave Jaxa).
   4. Rotor.
   5. Tija y corona.
   6. Movimiento al soporte LA FURY.
   7. Módulo automático.
   8. Descargar el muelle real con el cliquet.
   9. Tornillo del puente de volante.
   10. Volante.
   11. Lupa: aparece la falla, **aceite seco** en el amortiguador.
   12. Abrir el resorte del amortiguador.
   13. Limpiar.
   14. Aceitar con 9010.
   15. Reensamblar (automático, en orden inverso).
   16. Timegrapher final (+3 s/día, 286°).
2. **Práctica · Desarme del lado de puentes** (23 pasos). Sigue el orden real, que es el inverso del orden de montaje de ETA: … → volante → puente de áncora → áncora → rochet → cliquet → rueda de corona → puente de barrilete → barrilete → puente de rodaje → ruedas de segundos, media, escape e intermedia.

Si usas una herramienta equivocada o tocas piezas fuera de orden, recibes un mensaje que explica el error y pierdes 5 puntos. Un ejemplo de mensaje: "el rotor está tapado por el fondo roscado".
El volante oscila de verdad a 4 Hz con la amplitud del caso (188° → 286°). El segundero avanza en 8 pasos por segundo (28.800 A/h).

**Para añadir un caso**, agrega un objeto a `CASES` con sus `steps`. Cada paso define:
- `tool` (la herramienta correcta) y `target` (la pieza).
- `done`: la lista de acciones que se ejecutan al completarlo. Las disponibles son `msg`, `tg`, `flip`, `view`, `remove`, `toHolder`, `toInspect`, `letdown`, `reveal`, `openSpring`, `clean`, `oil` y `finish`.

## Marca LA FURY

- La caja de herramientas lleva un encabezado con el logo y un sello en cada herramienta.
- Las herramientas 3D llevan calcomanías: grabadas en oro en el destornillador, la llave de fondo, las pinzas, la aceitera y el soporte, y serigrafiadas en blanco en la lupa, la limpieza, la brújula, el desmagnetizador y el timegrapher.
- La pantalla del timegrapher arranca con el logo ("LA FURY TIMEGRAPHER TG-1").
- La alfombrilla del banco lleva el logo, y la pantalla final muestra la tienda "LA FURY Tools & Jewelry".
- El reloj se sigue llamando **ZARUMEI**.

Los archivos de marca están en `assets/`; su `README.md` explica cada uno.

## Desarrollo

```bash
npm install          # three, esbuild, playwright (solo para desarrollar)
npm run build        # incrusta assets → src/assets-inline.js y empaqueta src/ → game.js
npm test             # prueba E2E en iPhone 13 (Chromium headless + WebGL SwiftShader)
```

**Estructura**

| Archivo | Contenido |
|---|---|
| `src/main.js` | Motor: escena, cámara, toques (raycast), tweens, lógica de pasos e interfaz |
| `src/watch.js` | Reloj y movimiento procedurales (en mm): caja torneada, bisel grabado, esfera, agujas tipo espada, platina con perlage, puentes con côtes de Genève, ruedas, barrilete, rochet, cliquet, áncora, volante con espiral, amortiguador, módulo automático, rotor, tija |
| `src/tools3d.js` | Herramientas 3D con calcomanías LA FURY, el timegrapher y el soporte |
| `src/textures.js` | Texturas generadas en canvas |
| `src/cases.js` | Herramientas, piezas y casos (los datos del juego) |
| `game.js` | El paquete ya compilado. **Se sube al repositorio** para que GitHub Pages funcione sin compilar |

## Publicar en GitHub Pages

Este repositorio es **local**: no se creó ningún repositorio en GitHub ni se subió nada. Para publicarlo:

```bash
cd web3d
# 1) crea un repositorio vacío en github.com (por ejemplo zarumei-3d), sin README
git remote add origin https://github.com/TU-USUARIO/zarumei-3d.git
git branch -M main
git push -u origin main
# 2) En GitHub: Settings → Pages → Source: "Deploy from a branch" → Branch: main / (root) → Save
# 3) En 1–2 minutos queda en https://TU-USUARIO.github.io/zarumei-3d/
```

El archivo `.nojekyll` evita que GitHub Pages procese el sitio con Jekyll. Todas las rutas son relativas.

## Limitaciones conocidas

- **Geometría:** es procedural y estilizada. Las piezas siguen el orden y la disposición general del calibre, pero no son modelos CAD a escala exacta. Faltan, entre otras, la palanca de stop, la raqueta fina y los tornillos individuales como piezas separables.
- **Alcance del desarme:** el lado de la esfera (agujas, esfera, calendario, minutería, remontoir) todavía no se desarma.
- **Reensamblado:** es automático, en orden inverso.
- **Valores del timegrapher:** son valores de diseño del caso, no una simulación física.
- **Pruebas:** el rendimiento se probó solo en Chromium con WebGL por software (SwiftShader). Hay que probar en iPhone y Android reales.
