# ZARUMEI 3D · Atelier de Relojería
### por **Maison LA FORY · Tools & Jewelry**

Simulador 3D de reparación de relojes para el navegador del móvil (iPhone y Android), hecho con **Three.js**. Todo el juego está en español.
La interfaz tiene estética de boutique de alta joyería: ónix, terciopelo verde y burdeos, filetes de pan de oro, tipografía Cormorant Garamond y Cinzel con Jost para el texto, y destellos y focos suaves. El banco es de cuero negro con pespunte dorado y la bandeja de piezas, de terciopelo.

## Jugar
- **Sin servidor:** abre `index.html`. Funciona desde `file://`, porque las imágenes y las fuentes van incrustadas en `game.js` y `fonts.css`.
- **Servidor local:** ejecuta `python3 -m http.server 8080` y abre `http://localhost:8080` (o `http://IP:8080` desde el móvil).

### Dispositivos
- **iPhone:** una columna.
- **iPad vertical:** una columna más ancha, con botones y textos más grandes.
- **iPad horizontal y escritorio:** visor 3D grande con un panel lateral para mensajes, caja de herramientas y bandeja. Los textos tienen ancho máximo.
- **Resolución de render (DPR):** hasta 2, con un tope de ~2,6 MP renderizados. Se recalcula al girar el dispositivo, al redimensionar la ventana y al entrar o salir de pantalla completa.
- **Ratón:**
  - Arrastrar gira la vista, la rueda hace zoom y el botón derecho desplaza.
  - Al pasar por encima, se resalta la pieza o el tornillo.
  - Un clic usa la herramienta; mantener el clic gira un tornillo.
- **Teclado:**
  - `1`–`9` / `0` eligen herramienta (`Alt+1…9` para las demás) y `[` `]` cambian la punta.
  - `F` voltea, `H` da una pista, `W` da cuerda y `Esc` abre el menú.
  - `R` / `S` / `B` / `A` cambian de vista y `Shift+F` activa la pantalla completa.
- **Táctil y Apple Pencil:** Pointer Events con `touch-action: none` y márgenes de *safe area* en iPad y iPhone.
- **Pantalla completa:**
  - El botón ⛶ usa la Fullscreen API, con prefijos `webkit`.
  - Si el navegador no la permite, como Safari en iPhone, aparece la indicación *Compartir → Agregar a pantalla de inicio*.
  - La PWA (`manifest.json` con `display: fullscreen`, `apple-mobile-web-app-capable` e iconos en `icons/`) se abre a pantalla completa desde el icono. Las rutas son relativas, así que funciona en `/zarumei-3d/`.

### Modos
- **Historia:** 7 órdenes de trabajo con los 3 relojes (`src/data/story.js`). Cada caso nuevo se desbloquea al terminar el anterior y el progreso se guarda en `localStorage`.
- **Modo libre:** eliges cualquier reloj y cualquier falla compatible con su calibre, o **«sin falla»** para desarmarlo por completo y volver a montarlo. Las herramientas de diagnóstico (timegrapher, brújula, multímetro, lupa) muestran la falla que elegiste. Los cuatro nuevos (Diablo, Espina, Ala, Orbital) son el calibre ZC: cronógrafo, día, mes y profundímetro; Espina suma brújula, Ala la hora militar y Orbital la luna.
- **Boutique LA FORY:** vitrinas con foco sobre terciopelo y tres colecciones (Relojes, Herramientas, Joyería), con fichas y precios. La vista de detalle es 3D y se gira con el dedo. Las piezas se compran con los honorarios que cobras en cada reparación; es moneda del juego, no hay pagos reales.

### Controles
- **Vista:** un dedo gira, dos dedos hacen zoom. Los botones ⌚ / 🛠 / 🗃 / 🔍 cambian entre reloj, soporte, bandeja y alfombrilla.
- **Herramientas:** eliges la herramienta y toca la pieza. Las piezas de la bandeja también salen como fichas abajo. Con **SITIO** (botón del visor, activo de entrada) tocas la ficha y luego el anillo dorado donde esa pieza vive. **AUTO** la encaja al tocarla, como antes. Aceite, lupa y tornillos no cambian.
- **Calidad foto (8K):** más nítido, sombra más fina y un desenfoque suave solo en la lupa. La vista normal es una sola pasada, para el iPhone. No es un lienzo de 7680 px.
- **Tornillos, uno a uno:** con el **destornillador**, elige la **punta** (0,8 a 1,6 mm) y **mantén pulsado** el tornillo para girarlo, o tócalo varias veces.
  - Si la punta es demasiado grande, no entra. Si es demasiado pequeña, resbala y marca la cabeza; al segundo resbalón el tornillo **salta a la bandeja** (no se pierde). El agujero sigue marcado y se vuelve a poner con la punta correcta. Tocar la pieza, o su ficha 🔩, también lo aprieta.
  - Los tornillos van a la bandeja, al compartimento de su pieza. Con la pieza ya montada, la ficha 🔩 los aprieta uno a uno (punta correcta). También vale tocar el agujero fantasma. Si usas los tornillos de otra pieza, cuenta como **tornillo equivocado**.
  - La rueda de corona tiene **rosca a izquierdas**.
- **Piezas nuevas:** el botón **Piezas** abre el cajón de repuestos. Se saca la vieja y se toca **Poner nueva**. Una pila por debajo de ~1,4 V no se recarga: se cambia por una SR626SW de 1,55 V y se monta con las pinzas de plástico. Igual la bobina, el volante, el muelle, o cualquier otra pieza del calibre.
- **↻ Voltear:** da la vuelta al reloj, o al movimiento cuando está en el soporte.
- **Dar cuerda:** antes de la prueba final en el timegrapher.
- **SON / MUTE:** el reloj en marcha hace tic-tac (4 Hz mecánico, 1 Hz cuarzo). Tornillos, montaje y errores también suenan. El iPhone no suena hasta el primer toque.

### Montaje manual
El montaje sigue el orden inverso al desarme y lo controlan los datos. Una pieza solo se puede colocar si ya están montadas todas las que van debajo de ella (`coveredBy`), y cada tornillo hay que apretarlo a mano.
Se lubrica donde hace falta: 9010 en el rodaje, 9415 en las paletas, 8217 en el barrilete y grasa en la junta del fondo antes de cerrar. El protector de esfera es obligatorio para quitar y clavar las agujas; la de horas se clava a las 12:00, en el salto de fecha.
Para terminar hay que dar cuerda y hacer la prueba final en el timegrapher. La puntuación descuenta errores de orden, herramientas equivocadas, tornillos dañados, perdidos o equivocados, repuestos y pistas.

## Relojes y calibres (datos en `src/data/`)
| Reloj | Caja | Calibre |
|---|---|---|
| ZARUMEI Oro «Miami» | Buceo de 40 mm en oro amarillo, bisel grabado, fondo roscado, brazalete Oyster | **ZR-28**, automático de 4 Hz (arquitectura tipo ETA 2824-2 / SW200-1) |
| ZARUMEI «Cuba Azul» | Buceo de 41 mm en acero, bisel de cerámica azul, esfera azul con rayos de sol y el oso de la bandera | **ZR-28** |
| ZARUMEI Rosé Slim | Reloj de vestir extraplano de 38 mm en oro rosa, fondo a presión, esfera blanca, índices de bastón y brazalete de eslabones | **ZQ-11**, cuarzo fino (tipo Ronda 762 / Miyota GL20) |
| ZARUMEI Astral «Miami» | Turbillón de oro, nebulosa violeta, oso Miami, diamante en jaula, correa de aligátor | **ZT-18**, turbillón manual |
| ZARUMEI Astral «Cuba» | Turbillón de oro, cielo azul, jaula de volante, oso Cuba, diamante, correa de aligátor | **ZT-18**, turbillón manual |
| ZARUMEI Nácar | Buceo de acero, bisel de cerámica negra, nácar calado | **ZX-60**, 60 piezas, turbillón manual |
| ZARUMEI Noche | Oro 18 k, cielo estrellado, correa de aligátor azul marino | **ZX-60** |
| ZARUMEI Verano | El mismo buceo, esfera pintada con palmas, mar y el Morro | **ZX-60** |

El ZR-28 tiene **35 piezas y 25 tornillos**:
- **Caja y exterior:** fondo, rotor, tija y bridas de caja.
- **Lado de puentes:**
  - Módulo automático, volante (con raqueta y amortiguador con rubí visible), puente de áncora y áncora.
  - Rochet, rueda de corona (rosca a izquierdas) y cliquet.
  - Puente de barrilete y barrilete; puente de rodaje y las 4 ruedas.
- **Lado de esfera:**
  - Agujas (palancas, prensa y protector) y esfera con sus 2 tornillos de pie.
  - Calendario: placa, disco, rueda de horas, arrastre, minutería y piñón de cañón.
  - Remontoir: placa, balancín, tirette, **palanca de stop** y piñones.

El ZQ-11 tiene: brida de pila, pila, circuito con el cuarzo, bobina, puente de rodaje, rotor del motor paso a paso, 4 ruedas, agujas, esfera, minutería y remontoir.

El ZX-60 es el movimiento más largo: **60 piezas y 40 tornillos**, más que el Orbital (ZC-43, 54 piezas). Lo comparten Nácar, Noche y Verano. Lleva turbillón volante, repetición de minutos, calendario, oso, diamante, palma, colibrí, abeja y el Morro. En modo libre la falla es «Sin falla».

## Fallas (`src/data/faults.js`)
| Falla | Calibre |
|---|---|
| Aceite seco en el amortiguador del volante | auto |
| Magnetizado | auto |
| Muelle real fatigado | auto |
| Eje de volante roto | auto |
| Desregulado (raqueta) | auto |
| Pila agotada | cuarzo |
| Bobina cortada | cuarzo |
| Sin falla | ambos |

Cada falla define sus pasos de reparación (herramienta, sobre qué pieza o subpieza, y si la pieza tiene que estar puesta o fuera), las lecturas del timegrapher, la brújula o el multímetro, y lo que se aprende al resolverla.

## Desarrollo
```bash
npm install
npm run build             # assets → src/assets-inline.js, fuentes → fonts.css, src/ → game.js
node tests/engine-sim.mjs # juega sin interfaz todas las combinaciones reloj × falla y los 7 casos de historia
node tests/protector.mjs  # regresión del protector de esfera con toques reales (Miami, Cuba, Rosé); ENGINE=webkit opcional
node tests/devices.mjs    # iPhone 13, iPad Pro 11 vertical/horizontal, escritorio 1440×900 en Chromium y WebKit → shots/devices/
npm test                  # E2E en iPhone 13 (Playwright + Chromium + WebGL SwiftShader) → shots/ y shots/results.json
```
| Archivo | Contenido |
|---|---|
| `src/data/*.js` | Relojes, calibres (piezas, tornillos, lubricación), fallas, historia, herramientas y catálogo de la boutique |
| `src/engine.js` | Reglas sin 3D: estados, acceso por lado, tornillos, aceite, pasos de falla, puntuación y planificador de pistas |
| `src/movement.js` · `src/dialside.js` · `src/case3d.js` | Geometría procedural de los calibres ZR-28 y ZQ-11, de la esfera y las agujas, y de las cajas y brazaletes |
| `src/materials.js` · `src/textures.js` · `src/geom.js` | Materiales PBR (côtes de Genève, perlage, rubíes, tornillos azulados, PCB), texturas en canvas (cuero, terciopelo, ónix, esferas) y utilidades |
| `src/tools3d.js` | Herramientas 3D LA FORY, timegrapher, soporte de anillo y bandeja de terciopelo |
| `src/boutique.js` | Boutique: miniaturas 3D en caché, detalle 3D giratorio y saldo |
| `src/main.js` | Escena, cámara, toques y pulsación larga, animaciones, interfaz y API de pruebas (`window.__game`) |
| `scripts/make_logo.py` · `derive_brand.py` · `prep_dials.py` | Logo LA FORY, versiones derivadas de la marca y recorte de las esferas |

## Publicar
Repositorio `lafory/zarumei-3d`, con GitHub Pages desde la rama `main` (raíz). Hay que subir `game.js` y `fonts.css`, que son archivos compilados.

## Limitaciones
- **Geometría:** es procedural y estilizada, no CAD a escala exacta. El arte de la esfera Rosé tiene pequeñas manchas donde se borraron las agujas impresas.
- **Timegrapher:** muestra valores de diseño por falla, no una simulación física.
- **Rendimiento:** se midió con WebGL por software (SwiftShader), así que los FPS no son representativos. Faltan pruebas en dispositivos reales.
