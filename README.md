# ZARUMEI 3D · Atelier de Relojería
### por **Maison LA FORY · Tools & Jewelry**

Simulador 3D de reparación de relojes para el navegador del móvil (iPhone y Android), hecho con **Three.js**. Todo el juego está en español.
La interfaz tiene estética de boutique de alta joyería: ónix, terciopelo verde y burdeos, filetes de pan de oro, tipografía Cormorant Garamond y Cinzel con Jost para el texto, y destellos y focos suaves. El banco es de cuero negro con pespunte dorado y la bandeja de piezas, de terciopelo.

## Jugar
- **Sin servidor:** abre `index.html`. Funciona desde `file://`, porque las imágenes y las fuentes van incrustadas en `game.js` y `fonts.css`.
- **Servidor local:** ejecuta `python3 -m http.server 8080` y abre `http://localhost:8080` (o `http://IP:8080` desde el móvil).

### Modos
- **Historia:** 7 órdenes de trabajo con los 3 relojes (`src/data/story.js`). Cada caso nuevo se desbloquea al terminar el anterior y el progreso se guarda en `localStorage`.
- **Modo libre:** eliges cualquier reloj y cualquier falla compatible con su calibre, o **«sin falla»** para desarmarlo por completo y volver a montarlo. Las herramientas de diagnóstico (timegrapher, brújula, multímetro, lupa) muestran la falla que elegiste.
- **Boutique LA FORY:** vitrinas con foco sobre terciopelo y tres colecciones (Relojes, Herramientas, Joyería), con fichas y precios. La vista de detalle es 3D y se gira con el dedo. Las piezas se compran con los honorarios que cobras en cada reparación; es moneda del juego, no hay pagos reales.

### Controles
- **Vista:** un dedo gira, dos dedos hacen zoom. Los botones ⌚ / 🛠 / 🗃 / 🔍 cambian entre reloj, soporte, bandeja y alfombrilla.
- **Herramientas:** eliges la herramienta y tocas la pieza. Las piezas que están en la bandeja también aparecen como fichas abajo; para colocar una, eliges la herramienta y tocas su ficha.
- **Tornillos, uno a uno:** con el **destornillador**, elige la **punta** (0,8 a 1,6 mm) y **mantén pulsado** el tornillo para girarlo, o tócalo varias veces.
  - Si la punta es demasiado grande, no entra. Si es demasiado pequeña, resbala y marca la cabeza; al segundo resbalón el tornillo **salta y se pierde**, y hay que usar uno de repuesto.
  - Los tornillos van a la bandeja, al compartimento de su pieza. Para volver a ponerlos, toca la ficha 🔩 de su grupo (con eso se cargan en la punta) y luego cada agujero fantasma. Si usas los tornillos de otra pieza, cuenta como **tornillo equivocado**.
  - La rueda de corona tiene **rosca a izquierdas**.
- **↻ Voltear:** da la vuelta al reloj, o al movimiento cuando está en el soporte.
- **Dar cuerda:** antes de la prueba final en el timegrapher.
- **✦ Pista:** ilumina la herramienta, la punta y el objetivo, y cuesta 2 puntos.

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
