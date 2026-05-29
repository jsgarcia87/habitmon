# Mapas y escenarios

Guía para construir el mundo de Habitmon: regiones, mapas y escenarios que se sientan
**vivos y bien diseñados**, con la estética de Pokémon Cristal. Antes de usarla, lee
`habitmon-project.md` (mapas existentes, motor canvas, tiles 32 × 32, nomenclatura
`MapXXX`).

## Índice

1. Estructura de una región
2. Tipos de mapa y su papel
3. Principios de buen diseño de mapa
4. Tilesets, bloques y capas
5. Pasabilidad y comportamiento de tiles
6. Conexiones y warps
7. Escenarios: eventos, NPCs y escenas
8. Encuentros y zonas de Pokémon
9. Cómo se construyen los mapas en Habitmon
10. Lista de comprobación de un mapa

---

## 1. Estructura de una región

Una región Pokémon es una red de lugares conectados con un ritmo de progresión:

- **Pueblos y ciudades:** puntos de descanso, servicios e historia. Las ciudades
  grandes pueden tener un gimnasio o un punto de interés.
- **Rutas:** caminos entre poblaciones; aquí ocurre la exploración y los encuentros.
- **Zonas singulares:** cuevas, bosques, costas, lugares especiales.
- **Interiores:** casas, tiendas, centros, gimnasios.

Habitmon ya tiene una región arrancada (Pueblo Primavera, Ruta 29, Ciudad Crono,
Ciudad Fronsaf, Ruta 30). Diseña primero **a vista de pájaro** cómo encaja lo nuevo
en esa red, y solo después cada mapa en detalle.

## 2. Tipos de mapa y su papel

- **Pueblo inicial:** pequeño, seguro, enseña lo básico sin peligro.
- **Ruta:** conecta dos lugares; introduce un reto o una idea nueva cada vez.
- **Ciudad:** ofrece servicios y un objetivo (un gimnasio, un personaje, una zona).
- **Cueva / bosque:** exploración más densa, a veces un pequeño puzle o un camino que
  descubrir.
- **Interiores:** mapas pequeños y funcionales; cada NPC u objeto tiene una razón.

Cada mapa debe tener un **propósito claro** dentro del recorrido. Un mapa sin función
sobra.

## 3. Principios de buen diseño de mapa

- **Guía sin obligar.** Usa caminos, vallas, agua, árboles y desniveles para orientar
  al jugador, dejando margen para explorar.
- **Hitos visuales.** Cada mapa necesita algo reconocible y memorable: un edificio
  singular, un árbol grande, un lago, una estatua.
- **Sin vacío ni saturación.** Evita extensiones planas y vacías, pero tampoco llenes
  cada tile: el espacio respirable también comunica.
- **Recompensa la exploración.** Esquinas con un objeto, un atajo, un NPC con algo
  que contar.
- **Ritmo.** Alterna espacios abiertos y cerrados, tramos tranquilos y con reto.
- **Legibilidad.** El jugador debe entender por dónde se puede andar con solo mirar.
  Importante con público infantil.
- **Coherencia.** Bioma, paleta y tiles deben contar la misma historia que los mapas
  vecinos.

## 4. Tilesets, bloques y capas

- Un **tileset** es el conjunto de tiles disponibles para un tipo de mapa (exterior,
  cueva, interior...). En Habitmon el arte viene de RMXP, con tiles de 32 × 32 px.
- Los **bloques/metatiles** agrupan tiles en piezas mayores reutilizables (un trozo
  de casa, un árbol completo, una sección de camino).
- **Autotiles:** tiles que se ajustan a sus vecinos (bordes de agua, hierba, camino).
- **Capas:** dibuja el mapa por capas (suelo → detalle → elementos sobre el jugador,
  como copas de árboles). El motor canvas pinta capa a capa.

Reutiliza tiles y bloques: une la región y reduce el trabajo de arte.

## 5. Pasabilidad y comportamiento de tiles

Cada tile necesita definir:

- **Pasabilidad:** si se puede caminar sobre él y desde qué direcciones.
- **Prioridad/superposición:** si se dibuja por encima del jugador.
- **Comportamiento especial:** hierba alta (encuentros), agua, ledges (saltos en un
  sentido), escaleras, etc.

Una pasabilidad mal puesta es el bug más común en mapas: revísala siempre.

## 6. Conexiones y warps

- **Conexiones de borde:** mapas exteriores que se unen por sus bordes para formar un
  mundo continuo. En Habitmon, caminar hasta el borde lleva a la zona contigua.
- **Warps / puntos de transferencia:** puertas, entradas de cueva, escaleras,
  salidas de edificio que llevan a otro mapa y posición. Habitmon usa una transición
  de **iris** y recuerda la posición exterior al entrar a un interior.

Comprueba siempre que cada warp tenga su **warp de vuelta** y que la posición de
llegada caiga en un tile transitable, mirando hacia donde tiene sentido.

## 7. Escenarios: eventos, NPCs y escenas

> Estándar de fidelidad: en Cristal cada mapa define warp events, coord events, BG
> events y object events, y la lógica se expresa con scripts de comandos. Ver
> `pokecrystal-reference.md` §2–§4 para el modelo completo de eventos y movimiento.

Un mapa cobra vida con sus eventos:

- **NPCs:** personajes con diálogo, movimiento o función. En Habitmon los NPCs tienen
  **diálogo dinámico según el progreso del día**; mantén ese patrón. Amables y con
  lenguaje sencillo, por el público infantil.
- **Objetos:** ítems en el suelo, ocultos o en contenedores.
- **Carteles y señales:** orientan e informan; útiles para guiar a un niño.
- **Eventos de escena:** secuencias guiadas (un personaje que se acerca, una puerta
  que se abre, una breve cinemática).
- **Guardias y bloqueos:** un evento puede impedir el paso hasta cumplir una
  condición (Habitmon ya lo hace con el guardia de la Ruta 29).
- **Disparadores:** por contacto, por hablar, por pisar un tile o por una condición.

## 8. Encuentros y zonas de Pokémon

- Cada mapa de exploración puede tener una **tabla de encuentros**: qué Pokémon
  aparecen, con qué probabilidad y método (hierba, cueva, agua).
- Ajusta especies y niveles al **punto de progresión** de ese mapa.
- Mantén la coherencia bioma↔especie (Pokémon de agua cerca del agua, etc.).
- Las especies deben existir en `POKEMON_SPECIES` (`pokemonData.js`); si introduces
  una nueva, créala primero (ver `pokemon-and-moves.md`).

## 9. Cómo se construyen los mapas en Habitmon

### Mapas exteriores

Los mapas exteriores están definidos como objetos JS en
`react-app/src/data/worldData.js`, en el objeto `WORLD_DATA`. **No se exportan desde
RMXP** — se escriben directamente en ese archivo. Cada entrada tiene la forma:

```js
'MapXXX': {
  nombre: 'Nombre visible',
  npcs: [{ nombre, sprite, x, y, direccion, messages, isLeader? }],
  buildings: [{ type: 'gym'|'home'|'center'|'shop', x, y, gymId?, targetMapId, spawn }],
  exits: { up?, down?, left?, right? }  // { mapId, playerX, playerY }
}
```

- El arte de tiles proviene de RMXP (32 × 32 px); los tilesets van en
  `react-app/public/Graphics/tilesets/`.
- Añade la conexión de vuelta en el mapa vecino correspondiente.

### Mapas interiores — gimnasios

Los interiores de gimnasios se generan **proceduralmente** en
`react-app/src/data/gymData.js`. Cada uno tiene:
- Una entrada en `GYM_CONFIGS` (tileset, líder, tiles de suelo/pared/alfombra).
- Una función generadora (p. ej. `generateVestirse`) que devuelve la rejilla de
  tiles (20 × 15, interior habitable 10 × 12 con origen en x=5, y=2).
- La clave en `GENERATORS` para que `GYM_MAPS` se construya automáticamente.

### Mapas interiores — casas y servicios

Definidos en `react-app/src/data/interiorData.js` mediante funciones
`generateHouse1()`, `generatePokemonCenter()`, etc., y exportados en
`INTERIOR_CONFIGS` / `INTERIOR_MAPS`.

El componente `InteriorMap` (`react-app/src/components/InteriorMap.jsx`) renderiza
cualquier interior; los pisos se conectan con tiles de tipo `stair`.

Nombra los mapas con la convención `MapXXX` coherente con los existentes. Antes de
producir, lee el formato real de una entrada existente en `worldData.js` o `gymData.js`
y **replícalo**.

## 10. Lista de comprobación de un mapa

- ¿Tiene un propósito claro dentro de la región?
- ¿Hay un hito visual que lo haga reconocible?
- ¿La pasabilidad es correcta y legible?
- ¿Todos los warps tienen vuelta y caen en tiles transitables?
- ¿La paleta y los tiles encajan con los mapas vecinos?
- ¿La exploración tiene alguna recompensa?
- ¿La tabla de encuentros encaja con el bioma y la progresión, y sus especies
  existen en `POKEMON_SPECIES` (pokemonData.js)?
- ¿Sigue la nomenclatura `MapXXX` y el formato de datos de los mapas existentes?
- ¿Respeta la rejilla de 32 × 32 y la estética Cristal?
