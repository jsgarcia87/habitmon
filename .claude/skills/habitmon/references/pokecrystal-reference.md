# Estándar de fidelidad: pokecrystal

Habitmon corre como app web (React + Canvas 2D, backend PHP + MySQL), pero debe
**reproducir las mismas funcionalidades, con la misma fidelidad, que un juego de
RPG Maker XP + Pokémon Essentials** — y, en última instancia, que el **Pokémon
Cristal original**.

La referencia más fiel para eso no es Essentials (que ya es una reinterpretación),
sino **pokecrystal**: el desensamblado del código real de Pokémon Cristal, mantenido
por el proyecto pret. Documenta cómo funciona el juego por dentro, comando a comando.
Esta página resume pokecrystal como **especificación funcional** de Habitmon.

> Regla: el runtime es React/Canvas + PHP/MySQL; el listón de funcionalidad y
> comportamiento es Pokémon Cristal tal como lo describe pokecrystal. Si una mecánica
> es compleja, se implementa con fidelidad — **no se recorta ni se aproxima**.

Fuente: pokecrystal — https://pret.github.io/pokecrystal/ (índice de subsistemas) y
el repositorio https://github.com/pret/pokecrystal. Cuando necesites un detalle
exacto que no esté aquí, consulta esas páginas.

## Índice

1. Cómo está organizado pokecrystal
2. Scripts de eventos de mapa
3. Comandos de evento
4. Comandos de movimiento
5. Comandos de texto
6. Efectos de movimiento (ataques)
7. Comandos de animación de combate
8. Animaciones de sprites (pic animations)
9. Menús
10. Cómo trasladar todo esto a Habitmon
9. Cómo trasladar todo esto a Habitmon

---

## 1. Cómo está organizado pokecrystal

pokecrystal expone el juego como un conjunto de **subsistemas**, cada uno con su
propio lenguaje de comandos (scripts en ensamblador con macros legibles):

- **Scripts de eventos de mapa** — la lógica de cada mapa: NPCs, warps, escenas.
- **Comandos de evento** — el repertorio de acciones de un script de evento.
- **Comandos de movimiento** — cómo se mueven jugador y NPCs.
- **Comandos de texto** — cómo se muestran los diálogos.
- **Comandos de efecto de movimiento** — qué hace cada ataque en combate.
- **Comandos de animación de combate** — la animación visual de cada ataque.
- **Animaciones de imagen (pic)** — la animación de los sprites de Pokémon.
- **Menús** — el sistema de menús.

Habitmon debería tener un subsistema equivalente para cada uno de estos, aunque
implementado en JavaScript sobre canvas.

## 2. Scripts de eventos de mapa

Un mapa en pokecrystal define:

- **Object constants** — identificadores de los objetos/NPCs del mapa.
- **Map scripts** — scripts de escena y callbacks:
  - **Scene scripts:** escenas guiadas; el mapa puede estar en distintos "scene_id"
    y ejecutar un script según cuál esté activo.
  - **Callbacks:** se ejecutan en momentos concretos. Tipos: `MAPCALLBACK_NEWMAP`
    (al cargar el mapa), `MAPCALLBACK_TILES` (ajustar tiles), `MAPCALLBACK_OBJECTS`,
    `MAPCALLBACK_SPRITES`, `MAPCALLBACK_CMDQUEUE`.
- **Map events**, de cuatro tipos:
  - **Warp events:** `warp_event x, y, map, warp_id` — punto que transfiere a otro
    mapa.
  - **Coord events:** `coord_event x, y, scene_id, script` — se dispara al pisar una
    coordenada concreta.
  - **BG events:** `bg_event x, y, type, script` — interacción con un tile del fondo
    (carteles, objetos ocultos). Tipos: `BGEVENT_READ`, `BGEVENT_UP/DOWN/LEFT/RIGHT`,
    `BGEVENT_IFSET/IFNOTSET`, `BGEVENT_ITEM`, `BGEVENT_COPY`.
  - **Object events:** `object_event x, y, sprite, movement, rx, ry, h1, h2,
    palette, type, range, script, event_flag` — NPCs y objetos animados, con su tipo
    de movimiento, su rango de deambular y su script.

Tipos de movimiento de un objeto (NPC): quieto, deambular, girar al azar (lento o
rápido), caminar arriba/abajo, caminar izquierda/derecha, mirando fijo en una
dirección, nadar deambulando, y casos especiales (roca rompible, roca de Fuerza,
Sudowoodo...).

Tipos de objeto: `OBJECTTYPE_SCRIPT` (un NPC con script), `OBJECTTYPE_ITEMBALL` (un
objeto recogible) y `OBJECTTYPE_TRAINER` (un entrenador, con sus textos de visto,
derrotado y derrota, y su script de combate).

Habitmon debe modelar cada mapa con esta misma estructura: objetos, warps, eventos de
coordenada, eventos de fondo, scripts de escena y callbacks.

## 3. Comandos de evento

Un script de evento es una **secuencia de comandos**. pokecrystal define alrededor de
170 comandos; las familias principales:

- **Control de flujo:** `scall`/`farscall` (llamar a otro script), `sjump`/`sdefer`
  (saltar), `if...` (`ifequal`, `ifnotequal`, `iftrue`, `iffalse`, `ifgreater`,
  `ifless`), `jumpstd`/`callstd` (scripts estándar), `end`, `endall`.
- **Memoria y lógica:** `setval`/`addval`, `random`, leer/escribir memoria y
  variables (`readvar`, `writevar`, `loadvar`), eventos y flags (`checkevent`,
  `setevent`, `clearevent`, `checkflag`, `setflag`, `clearflag`).
- **Objetos y economía:** `giveitem`/`takeitem`/`checkitem`, `givemoney`/`takemoney`/
  `checkmoney`, `givecoins`/`takecoins`/`checkcoins`, `verbosegiveitem`.
- **Pokémon:** `givepoke`, `giveegg`, `checkpoke`, `givepokemail`.
- **Texto e interfaz:** `opentext`/`closetext`, `writetext`, `jumptext`,
  `jumptextfaceplayer`, `yesorno`, `loadmenu`/`closewindow`, `verticalmenu`,
  `_2dmenu`, `waitbutton`, `promptbutton`, `pokepic`/`closepokepic`.
- **Personajes y movimiento:** `applymovement`, `faceplayer`, `faceobject`,
  `turnobject`, `appear`/`disappear`, `follow`/`stopfollow`, `moveobject`,
  `showemote`, `variablesprite`, `setlasttalked`.
- **Mapa:** `warp`, `warpmod`, `warpfacing`, `blackoutmod`, `changeblock`,
  `changemapblocks`, `reloadmap`, `refreshmap`, `earthquake`.
- **Combate:** `loadwildmon`, `loadtrainer`, `loadtemptrainer`, `startbattle`,
  `reloadmapafterbattle`, `winlosstext`, `catchtutorial`, `trainertext`.
- **Audio:** `playmusic`, `playmapmusic`, `musicfadeout`, `playsound`, `cry`,
  `warpsound`, `waitsfx`.
- **Especiales:** `pokemart`, `elevator`, `trade`, `fruittree`, `phonecall`,
  `special` (rutinas concretas).

Habitmon no necesita los 170 literalmente, pero su motor de scripts debería cubrir
estas familias: solo así un NPC, un cartel o una escena pueden hacer lo mismo que en
Cristal.

## 4. Comandos de movimiento

El movimiento en Cristal va por **rejilla de tiles** y se expresa con comandos, cada
uno en sus 4 direcciones:

- **Girar:** `turn_head` (solo la cabeza), `turn_step`.
- **Pasos a distinta velocidad:** `slow_step`, `step` (normal), `big_step`,
  `slow_slide_step`, `slide_step`, `fast_slide_step` (deslizarse, p. ej. sobre
  hielo).
- **Saltos:** `slow_jump_step`, `jump_step`, `fast_jump_step` (saltar un ledge).
- **Giros relativos:** `turn_away`, `turn_in`, `turn_waterfall`.
- **Estado de sprite:** `set_sliding`/`remove_sliding`, `fix_facing`/
  `remove_fixed_facing`, `show_object`/`hide_object`, `remove_object`.
- **Esperas y bucles:** `step_sleep length`, `step_loop`, `step_end`.
- **Acciones especiales:** `step_bump` (chocar), `step_shake` (temblor),
  `tree_shake`, `rock_smash`, `step_dig`/`return_dig`, `skyfall`, `teleport_from`/
  `teleport_to`, `fish_cast_rod`/`fish_got_bite`, `show_emote`/`hide_emote`.

Implicaciones de fidelidad para Habitmon: el movimiento es **paso a paso entre
celdas** (no libre por píxel), existen varias velocidades de paso, hay pasos de
deslizamiento y de salto, y el motor distingue "girar la cabeza" de "dar un paso".

## 5. Comandos de texto

El texto de los diálogos en Cristal también es un **script de comandos**, no una
simple cadena. Comandos principales:

- **Escritura:** `text_start` / `text` (escribir hasta el terminador `"@"`),
  `text_far` (texto de otro banco), `text_ram` (texto desde memoria), `text_box`
  (dibujar un cuadro), `text_move` (saltar a otra posición de tile).
- **Números y valores:** `text_decimal` (imprimir un número de N dígitos),
  `text_bcd` (número en BCD), `text_today` (el día de la semana).
- **Buffers:** `text_buffer id` inserta una cadena variable previamente guardada
  (nombre del jugador, mote del Pokémon, etc.) — es como Cristal mete nombres
  dinámicos en una frase fija.
- **Pausas y avance:** `text_pause` (pausa de ~30 fotogramas), `text_dots n`
  (imprime puntos suspensivos uno a uno), `text_promptbutton` (espera con flecha
  visible), `text_waitbutton` (espera sin flecha), `text_scroll`.
- **Sonidos:** `sound_fanfare`, `sound_item`, `sound_caught_mon`,
  `sound_dex_fanfare_*` — efectos de sonido disparados desde el propio texto.
- **Fin:** `text_end`.

**Caracteres de control** dentro del texto, que dan formato: `<NEXT>` (bajar una
línea), `<LINE>` (escribir en la línea inferior), `<PARA>` (nuevo párrafo), `<CONT>`
(desplazar a la línea siguiente), `<PROMPT>` (pedir al jugador que cierre el cuadro,
encadenando con otro evento), `<DONE>` (terminar el cuadro de texto), `@` (nueva
página de Pokédex).

Implicación para Habitmon: un diálogo no es solo una string — es **texto + comandos**
que controlan el aparecer carácter a carácter, las pausas, los saltos de línea, la
inserción de nombres variables y los sonidos. El motor de texto debería interpretar
esa mezcla para tener la sensación de los cuadros de diálogo de Cristal.

## 6. Efectos de movimiento (ataques)

Cada ataque en Cristal se ejecuta como una **secuencia de comandos de efecto**. Un
movimiento de daño simple, por ejemplo, encadena algo así: `checkturn` →
`checkobedience` → `usedmovetext` → `doturn` → `critical` → `damagestats` → `stab` →
`damagevariation` → `checkhit` → `applydamage` → `criticaltext` →
`supereffectivetext` → `checkfaint` → `endmove`. Es decir, el daño no es "una
fórmula", es una **tubería de pasos** que se pueden recombinar.

pokecrystal define unos 175 comandos de efecto. Bloques principales:

- **Resolución del turno:** `checkturn`, `checkobedience`, `doturn`, `checkhit`,
  `endturn`, `endmove`.
- **Cálculo de daño:** `critical`, `damagestats`, `stab`, `damagevariation`,
  `damagecalc`, `applydamage`, `constantdamage`, `ohko`, `falsewipe` (no baja de
  1 PS), `getmagnitude`, `happinesspower`/`frustrationpower`, `hiddenpower`,
  `triplekick`, `furycutter`, `rolloutpower`, `doubleflyingdamage`/
  `doubleundergrounddamage`/`doubleminimizedamage`.
- **Estados:** `poisontarget`, `sleeptarget`, `burntarget`, `freezetarget`,
  `paralyzetarget`, `confusetarget`, `poison`, `paralyze`, `confuse`,
  `tristatuschance` (uno de varios estados).
- **Estadísticas:** `statup`/`statdown` y todas sus variantes por estadística y por
  1 o 2 niveles (`attackup`, `defensedown2`, `speedup`, `accuracydown`...),
  `allstatsup`, `bellydrum`, `resetstats`, `curl`.
- **Daño residual / recursivo:** `recoil`, `draintarget`, `leechseed`, `nightmare`,
  `curse`, `painsplit`, `counter`, `mirrorcoat`, `bide` (`storeenergy`/
  `unleashenergy`), `rage`/`ragedamage`.
- **Control del combate:** `flinchtarget`, `forceswitch`, `traptarget`, `disable`,
  `encore`, `lockon`, `protect`, `endure`, `destinybond`, `mist`, `safeguard`,
  `screen` (Reflect/Pantalla Luz), `spikes`, `perishsong`, `attract`, `foresight`.
- **Carga y multiturno:** `charge`/`checkcharge`, `rechargenextturn`, `rampage`/
  `checkrampage` (Furia/Otra vez), `futuresight`.
- **Clima:** `startrain`, `startsun`, `startsandstorm`.
- **Curación:** `heal`, `healbell`, `healmorn`/`healday`/`healnite` (curación según
  el momento del día — sello de Gen 2).
- **Movimientos meta:** `metronome`, `mirrormove`, `mimic`, `sketch`, `sleeptalk`,
  `transform`, `conversion`/`conversion2`, `psychup`, `present`, `beatup`.
- **Otros:** `payday`, `thief`, `pursuit`, `spite`, `fakeout`, `snore`, `splash`,
  `selfdestruct`, `teleport`, `kingsrock`, `clearhazards`.

Implicación para Habitmon: un movimiento **no es solo tipo + poder**; es una
**lista de comandos de efecto**. El motor de combate debería implementar un catálogo
de comandos y construir cada ataque encadenándolos, exactamente como hace Cristal.
Así un ataque nuevo puede tener carga, multi-golpe, drenaje o cambio de estadísticas
con fidelidad real.

## 7. Comandos de animación de combate

La animación visual de un ataque también es un **script**. Comandos clave de
pokecrystal:

- **Esperas:** `anim_wait length` — espera *length* fotogramas (define el ritmo).
- **Gráficos:** `anim_1gfx`…`anim_5gfx` cargan de 1 a 5 juegos de gráficos;
  `anim_battlergfx` carga gráficos del propio combatiente.
- **Objetos:** `anim_obj object, x, y, param` crea un objeto de animación en una
  coordenada; los objetos son **máquinas de estado**, y `anim_incobj`/`anim_setobj`
  cambian su estado. `anim_clearobjs` los elimina.
- **Efectos de fondo:** `anim_bgeffect`, `anim_incbgeffect`.
- **Paletas y color:** `anim_bgp`, `anim_obp0`, `anim_obp1` cambian paletas;
  `anim_resetobp0` restaura. Con esto se hacen flashes y parpadeos.
- **Sonido:** `anim_sound duration, tracks, sound_id` reproduce un sonido;
  `anim_cry pitch` reproduce el grito del Pokémon.
- **Sprite del combatiente:** `anim_transform`, `anim_raisesub`/`anim_dropsub`,
  `anim_minimize`/`anim_minimizeopp`, `anim_updateactorpic`.
- **Control de flujo:** `anim_jump`, `anim_loop count`, `anim_call`/`anim_ret`,
  `anim_if_param_equal`, `anim_if_var_equal`, `anim_setvar`/`anim_incvar`.
- **Pokéball:** `anim_checkpokeball` (calcula el meneo de la ball), `anim_keepsprites`.

Implicación para Habitmon: una animación de ataque es una **línea de tiempo de
comandos** —esperar, generar objetos, cambiar paletas, sonar—, no un gif fijo. El
motor canvas debería interpretar un mini-script de animación por cada movimiento, con
objetos que son máquinas de estado. Ver `animations.md` para la implementación.

## 8. Animaciones de sprites (pic animations)

pokecrystal anima los sprites de Pokémon con "pic animations": el pequeño movimiento
del Pokémon al entrar en combate y en pantallas como el estado o la Pokédex. Es lo
que da el sello "vivo" de Gen 2. Una pic animation se monta en **tres partes**:

- **Animación de alto nivel:** una secuencia de comandos —`frame N, duration`
  (mostrar el fotograma N durante *duration*; el fotograma 0 es el sprite original
  sin cambios), `setrepeat N` (fijar cuántas veces se repite), `dorepeat I`
  (repetir desde el comando I), `endanim` (terminar).
- **Bitmasks:** máscaras que se superponen al sprite para marcar **qué tiles**
  cambian en cada fotograma (solo se redibuja la parte que se mueve).
- **Definiciones de fotograma:** el primer byte es la bitmask que usa ese fotograma;
  los siguientes son los ids de tile que se asignan a cada bit de la máscara.

Hay dos capas de animación: la **animación principal** (se reproduce en todas
partes, p. ej. al aparecer en combate) y la **animación de idle** (se añade a la
principal en pantallas estáticas: parpadeos, coleteos...).

Implicación para Habitmon: la animación de un Pokémon no redibuja el sprite entero
en cada fotograma — cambia **solo unos tiles** sobre el sprite base, según una
máscara, y puede tener una capa de idle aparte. Reprodúcelo: anima por regiones del
sprite, con una animación de entrada y otra de idle, en vez de una spritesheet de
sprites completos.

## 9. Menús

Cristal no tiene "un" menú: tiene **varios tipos de menú**, cada uno con su cabecera
de datos (`MenuHeader`) y sus opciones (`MenuData`):

- **VerticalMenu:** el menú simple — una lista vertical de opciones con cursor. La
  mayoría de menús del juego.
- **ScrollingMenu:** el único con scroll; para listas largas (la bolsa de objetos,
  el PC). Soporta columnas con cantidad (objeto + nº), flechas de scroll y funciones
  de dibujado por entrada.
- **_2DMenu:** menú bidimensional, el cursor se mueve en las 4 direcciones; se usa
  para el **menú de combate** (LUCHAR/OBJETO/POKÉMON/HUIR) y poco más.
- **DoNthMenu / SetUpMenu:** menús verticales con opciones **dinámicas** (generadas
  en tiempo de ejecución, no fijas).

Rasgos comunes que definen la sensación: la opción CANCELAR es una entrada especial
(índice -1); hay flags para activar/desactivar el botón B, el botón Select, el
"envolver" el cursor al llegar al extremo (wrap), un sonido de clic al moverse, y el
guardado/restaurado de los tiles de fondo al abrir y cerrar el menú.

Implicación para Habitmon: al construir menús, distingue el **tipo** (lista simple,
lista con scroll, rejilla 2D, lista dinámica) y reproduce los rasgos esperados —
cursor, opción de cancelar, wrap, sonido de clic, cuadro con borde, texto carácter
a carácter. El menú de combate en concreto es un menú 2D.

## 10. Cómo trasladar todo esto a Habitmon

- **No copies ensamblador.** pokecrystal es la *especificación de comportamiento*; la
  implementación es JavaScript sobre canvas.
- **Reproduce los subsistemas como intérpretes de datos.** Un script de evento, un
  efecto de movimiento o una animación deberían ser **datos** (un array de comandos)
  que un intérprete ejecuta. Eso replica la arquitectura de Cristal y hace el
  contenido fácil de crear y editar.
- **Implementa catálogos de comandos.** Un catálogo de comandos de evento, otro de
  efectos de movimiento, otro de comandos de animación. Crear contenido nuevo =
  combinar comandos ya implementados.
- **Empieza por lo que el proyecto ya usa y amplía.** No hace fala implementar los
  175 efectos de golpe; sí tener la arquitectura para que añadir el siguiente sea
  trivial.
- **Cuando dudes de un comportamiento exacto** (probabilidad de un estado, orden de
  un cálculo, cómo menea la Pokéball), consulta la página de pokecrystal
  correspondiente o el repositorio: es la fuente canónica.
- **Respeta los detalles de Gen 2** que pokecrystal hace explícitos: curación según
  el momento del día, división físico/especial por tipo (no por movimiento),
  tipos Siniestro y Acero, mecánicas como Furia Cutter o Rollout que escalan.
