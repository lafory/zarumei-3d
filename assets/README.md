# Assets de marca: LA FORY Tools & Jewelry

Origen: el arte del oso azul con gorra CUBA que nos dio el usuario. El original traía letras doradas con un error («LA FURY»). `scripts/make_logo.py` borra esas letras, conserva al oso y vuelve a rotular **«LA FORY»** con letras doradas extruidas (fuente Anton, bisel, grano y sombra de contacto). El resultado es `lafory-master.jpg`, y `scripts/derive_brand.py` deriva de él todas las versiones.
Marca de las herramientas, la tienda y la joyería del juego. **El reloj se sigue llamando ZARUMEI.**

| Archivo | Uso |
|---|---|
| `lafory-logo.jpg` | 800×800, fondo negro original, optimizado para la web |
| `lafory-logo.png` / `.webp` | 1024 px de ancho, **fondo transparente** (recortado con un flood-fill desde los bordes negros, no hecho a mano) |
| `lafory-logo-512.webp`, `lafory-logo-256.png` | Versiones ligeras para la interfaz (encabezado de la caja de herramientas, tienda, títulos) |
| `lafory-badge-128.png` / `.webp` | Sello pequeño para iconos de herramientas |
| `lafory-decal-engrave-gold.png` / `-256.webp` | Calcomanía monocroma en tono oro, con estilo de **grabado**: mangos de destornillador, llave de fondo, soporte, aceitera |
| `lafory-decal-print-white.png` | Calcomanía monocroma clara, con estilo de **serigrafía**: carcasa y pantalla de arranque del timegrapher, cajas de joyería |

Cómo aplicarlas en 3D (Three.js o Unity): usar la calcomanía como textura en un plano o un *decal projector* sobre el mango o la carcasa, con mezcla alfa, y usar la luminancia como mapa de relieve o normal para que se vea grabado.

## Esferas de los relojes nuevos (`scripts/prep_dials.py`)
| Archivo | Uso |
|---|---|
| `dial-cuba-bear.webp` | Oso con bandera cubana recortado (fondo transparente). La esfera azul con rayos de sol se pinta encima, en `textures.js`. |
| `dial-rose-art.webp` | Arte neón ZARUMEI con el oso naranja y turquesa, recortado de la foto. Se retocaron las agujas impresas (inpainting) y el blanco pasó a transparente. |
| `dial-miami.jpg` | Esfera "Miami" original |
