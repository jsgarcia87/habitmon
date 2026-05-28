# El proyecto Habitmon

Referencia del proyecto **real**. Léela siempre antes de crear o modificar contenido:
describe cómo está construido Habitmon, qué existe ya y cómo encajar lo nuevo. El
objetivo es **mejorar y ampliar** el juego, respetando esta base.

## Índice

1. Qué es Habitmon
2. Stack tecnológico
3. Modelo de datos (MySQL)
4. Archivos de datos del frontend
5. La API REST
6. Contenido que ya existe
7. Convenciones del juego
8. Cómo encajar contenido nuevo

---

## 1. Qué es Habitmon

RPG de hábitos diarios inspirado en Pokémon Cristal. El jugador completa tareas
reales del día (vestirse, desayunar, hacer ejercicio...) para desbloquear batallas
contra líderes de gimnasio y hacer crecer a su Pokémon compañero. Ciclo diario:
hacer los hábitos en la vida real → marcarlos en el juego → retar al gimnasio
correspondiente → ganar la medalla → el Pokémon sube de nivel → al día siguiente se
reinicia. Los usuarios finales son niños.

## 2. Stack tecnológico

- **Frontend:** React + Vite (SPA con rutas manejadas por estado en `App.jsx`).
  Estado global en `GameContext` (`react-app/src/context/GameContext.jsx`).
- **Renderizado:** Canvas 2D con `requestAnimationFrame`. Mapas y batallas se dibujan
  en canvas, no son DOM.
- **Gráficos:** tiles de **32 × 32 px**, arte de RPG Maker XP (RMXP) adaptado. Fuente
  Press Start 2P.
- **Backend:** PHP, API REST en `hb_api/index.php`. Rutas via query param `?route=`.
- **Base de datos:** MySQL relacional.
- **Autenticación:** Bearer token guardado en `localStorage` (clave `hm_token`).

**Importante:** Habitmon **no se ejecuta sobre RPG Maker ni Pokémon Essentials**.
RMXP se usa como **fuente de arte** (tilesets, sprites). Los mapas y el contenido del
juego se definen directamente en archivos JS del frontend y en tablas MySQL. Cuando
generes código, hazlo para este stack (React/Canvas en frontend, PHP/MySQL en
backend).

## 3. Modelo de datos (MySQL)

| Tabla | Contenido |
| --- | --- |
| `usuarios` | Cuentas: username, email, password_hash, avatar, monedas, inventario (JSON) |
| `habitos` | Registro diario de hábitos por usuario y fecha (gym_id, habito_id, completado) |
| `habitos_template` | Definición de hábitos: id, pokemon_template_id FK, nombre, daño, icono, obligatorio, activo |
| `gimnasios_template` | Configuración de gimnasios: gym_id, gym_nombre, tiempo ENUM, battleback, orden, activo |
| `pokemon_template` | Roster de Pokémon por gimnasio: id, gym_id FK, pokemon_id, nombre, nivel, orden_en_gym |
| `pokemon_coleccion` | Pokémon conseguidos por usuario: pokemon_id, pokemon_nombre, gimnasio_origen, xp, nivel, is_partner |
| `progreso_diario` | Medallas del día: usuario_id, fecha, gimnasios_completados (JSON) |
| `habito_presets` | Configuraciones guardadas de hábitos: usuario_id, nombre, config_json |
| `amigos` | Amistad entre usuarios: usuario_id_1, usuario_id_2, estado ENUM, solicitado_por |
| `usuario_posicion` | Posición MMO: usuario_id PK, mapa_id, posicion_x, posicion_y, direccion, ultima_actualizacion |

**Distinción clave:** `pokemon_template` no almacena estadísticas base ni tipos — eso
vive en `pokemonData.js` (frontend). La BD solo guarda qué Pokémon aparece en qué
gimnasio y a qué nivel. El frontend cruza ambas fuentes para crear el combatiente.

Las tablas `*_template` guardan **configuración del juego**; las demás guardan
**datos por usuario**. Para añadir contenido nuevo casi siempre se toca una
`_template`.

## 4. Archivos de datos del frontend

Gran parte del contenido del juego (species, movimientos, mapas, gimnasios) vive en
archivos JS del frontend, **no** en la BD:

| Archivo | Contenido |
| --- | --- |
| `react-app/src/data/pokemonData.js` | `POKEMON_SPECIES` (id→{name,types,baseStats}), `GYM_LEADER_POKEMON` (gymId→pokemon o equipo), `createBattlePokemon()`, `getPokemonByGym()` |
| `react-app/src/data/gymData.js` | `GYM_CONFIGS` (config de cada gimnasio interior: tileset, líder, tiles, diálogos), generadores de mapas de gimnasio, `GYM_MAPS`, `GYM_TILE_PROPERTIES` |
| `react-app/src/data/moveData.js` | `MOVE_DATA` (75+ movimientos: tipo, cat., potencia, precisión, efectos), `POKEMON_MOVES` (moveset por especie, clave int) |
| `react-app/src/data/evolutionData.js` | `EVOLUTION_DATA` (cadenas de evolución por nivel), `getEvolution()` |
| `react-app/src/data/worldData.js` | `WORLD_DATA` (mapas exteriores: NPCs, edificios, salidas, exits) |
| `react-app/src/data/interiorData.js` | `INTERIOR_CONFIGS` y `INTERIOR_MAPS` (casa, Pokécenter, tienda, re-exporta gimnasios de gymData) |

IDs de especie en `POKEMON_SPECIES`: strings de 3 dígitos con cero (`'016'`, `'025'`).
Claves en `POKEMON_MOVES`: enteros sin cero (`16`, `25`).

## 5. La API REST

Base: `hb_api/index.php`. Todas las rutas se pasan como `?route=/dominio/accion`.
Las que requieren auth usan header `Authorization: Bearer <token>`.

**Autenticación**
- `POST /auth/register` — registro
- `POST /auth/login` — login → devuelve token

**Starter**
- `POST /starter/elegir` — elige Pokémon inicial
- `GET /starter/info` — info del starter actual

**Hábitos**
- `GET /habitos/hoy` — hábitos del día; inserta los que falten para la fecha
- `POST /habitos/completar` — marca un hábito completado → +XP al compañero, +monedas
- `POST /habitos/reset` — resetea hábitos del día

**Gimnasios**
- `GET /gimnasios/hoy` — gimnasios disponibles hoy
- `POST /gimnasios/completar` — victoria en gimnasio → medalla + Pokémon a colección + monedas

**Batalla (encuentros salvajes)**
- `POST /battle/victory` — registra victoria en batalla salvaje → XP + monedas al starter

**Colección**
- `GET /coleccion` — lista de Pokémon del usuario
- `POST /coleccion/capturar` — captura un Pokémon salvaje
- `POST /coleccion/evolucionar` — evoluciona un Pokémon

**Tienda e inventario**
- `POST /tienda/comprar` — compra un objeto
- `POST /usuario/usar_item` — usa un objeto del inventario
- `POST /usuario/configurar_encuentros` — activa/desactiva encuentros salvajes

**Estadísticas**
- `GET /stats` — estadísticas del usuario

**Amigos / MMO**
- `GET /amigos` — lista de amigos
- `POST /amigos/enviar` — envía solicitud de amistad
- `POST /amigos/aceptar` — acepta solicitud
- `POST /amigos/rechazar` — rechaza solicitud
- `GET /amigos/{friendId}/gimnasios` — gimnasios completados hoy por un amigo
- `POST /mapa/posicion` — actualiza posición del jugador (MMO)

**Administración**
- `GET /admin/config` — obtiene configuración de gimnasios y hábitos
- `POST /admin/config` — guarda configuración (actualiza `habitos_template`)
- `GET /admin/presets` — lista presets guardados
- `POST /admin/presets` — guarda un preset
- `DELETE /admin/presets/{id}` — elimina un preset

Antes de añadir o cambiar un endpoint, **revisa `hb_api/index.php`** y sigue el
patrón existente (respuesta JSON con `success: true/false`).

## 6. Contenido que ya existe

### Mapas exteriores

| ID | Nombre |
| --- | --- |
| Map002 | Pueblo Primavera (inicio; tiene edificios de los gimnasios Vestirse, Orden e Higiene) |
| Map008 | Ruta 29 (tiene edificio del gimnasio Fitness) |
| Map070 | Ciudad Fronsaf (tiene edificios de los gimnasios Higiene y Comida) |
| Map038 | Ruta 30 (acceso a sr. Pokémon) |
| Map040 | Ruta 31 (cueva oscura) |
| Map078 | Ciudad Malva (parcial / en desarrollo) |

Nomenclatura `MapXXX`, heredada de RMXP. Mantén ese formato para mapas nuevos.

### Mapas interiores — gimnasios

Los interiores de gimnasios se identifican por una clave propia en `GYM_CONFIGS`
(`gymData.js`). El mapa se genera proceduralmente; cada uno tiene su tileset,
líder NPC, diálogo y tiles de suelo/pared/alfombra.

| Clave interior | Gimnasio (gym_id) | Líder |
| --- | --- | --- |
| Map015 | vestirse | LÍDER DE VESTIMENTA |
| Map046 | higiene | LÍDER DE HIGIENE |
| Map007 | orden | LÍDER DE ORDEN |
| Map016 | comida | LÍDER DE COMIDA |
| Map005 | desayuno | LÍDER DE DESAYUNO |
| Map008 | fitness | LÍDER DE FITNESS |

Otros interiores: `house_1` / `house_2` (casa del jugador, PB y planta alta),
`house_pokemon` (casa del sr. Pokémon), `pokemon_center`, `pokemon_shop`.

### Pokémon disponibles (POKEMON_SPECIES)

17 especies definidas: Pidgey (016), Rattata (019), Spearow (021), Pikachu (025),
Meowth (052), Persian (053), Machop (066), Machoke (067), Grimer (088),
Snorlax (143), Mankey (056), Charizard (006), Voltorb (100), Abra (063),
Chikorita (152), Cyndaquil (155), Totodile (158).

Cadenas de evolución definidas: Chikorita→Bayleef→Meganium, Cyndaquil→Quilava→
Typhlosion, Totodile→Croconaw→Feraligatr, Pidgey→Pidgeotto→Pidgeot, y las tres
líneas Kanto (Bulbasaur, Charmander, Squirtle).

### Equipo de cada gimnasio (GYM_LEADER_POKEMON)

Algunos gimnasios tienen **un equipo de varios Pokémon**, no uno solo. El motor de
combate (`BattleScreen.jsx`) gestiona la secuencia de Pokémon del líder con
`enemyTeam[]` y `teamIndex`. Definición actual:

- **vestirse:** Meowth (lv 5) → Persian (lv 8) — equipo de 2
- **higiene:** Grimer (lv 8)
- **orden:** Voltorb (lv 10)
- **desayuno:** Snorlax (lv 12)
- **comida:** Mankey (lv 15)
- **fitness:** no definido en GYM_LEADER_POKEMON (usa fallback Pidgey lv 5)
- **cena / estudio:** Charizard (lv 20) / Abra (lv 10) — definidos pero sus interiores
  aún no están en GYM_CONFIGS

### Economía y progresión

- Inicio: 300 monedas, 5 Pokéballs, 2 Pociones, starter elegido entre varios, avatar
  entre 4.
- Completar un hábito: XP + monedas al compañero (valores exactos en backend).
- Ganar una batalla (salvaje, `/battle/victory`): XP al starter.
- Ganar un gimnasio (`/gimnasios/completar`): medalla + Pokémon a colección + monedas.
- Subir de nivel: umbral de XP gestionado por el backend; el servidor devuelve
  `new_xp` y `new_level` en las respuestas de combate/hábito.

### Combate (Gen 2 Cristal)

Por turnos. El motor vive en `react-app/src/utils/`:

- **`battleEngine.js`** — `determineTurnOrder()`, `processMove()`,
  `processEndTurnEffects()`
- **`damageCalculator.js`** — `calculateDamage()` y tabla de efectividad de tipo
- **`moveEffects.js`** — efectos secundarios de movimientos

Fórmula de daño:
```
daño = ((2 × nivel / 5 + 2) × poder × A / D) / 50 + 2
```

Modificadores: STAB ×1.5; efectividad ×0/×0.5/×1/×2; crítico ×1.5 (6.25 %, o 25 %
en movimientos de alta crítica, critBoost: true); aleatorio 0.85–1.0; quemadura ÷2
en físicos; Reflect/Light Screen ÷2 (si no es crítico); clima ±50 % en Agua/Fuego.

Estadísticas por nivel:
```
HP     = floor((HP_base   × nivel / 25) + nivel + 10)
Atk/Def = floor((stat_base × nivel / 50) + 5)
```
(igual para At. Esp., Def. Esp., Velocidad)

Ajuste por rango de estadística:
```
stat_ajustada = floor(stat_base × (max(2, 2+rango) / max(2, 2−rango)))
```

Orden de turno: prioridad del movimiento primero; luego velocidad (parálisis reduce
velocidad al 25%); desempate aleatorio.

Estados: sueño (1–7 turnos), congelación (20 % de descongelarse/turno), parálisis
(25 % de fallo), confusión (2–5 turnos, 50 % auto-golpe de 40 de potencia), veneno
(1/8 HP/turno), veneno tóxico (escalante 1/16×contador), látex (1/8 HP drain).
Clima: lluvia, sol, tormenta de arena (5 turnos por defecto).

Captura: Pokéball 45 %, Superball 70 % (llamada a `/coleccion/capturar`).

### Pantallas del juego (App.jsx)

Principales: `login`, `register`, `starter`, `city` (CityScreen / mapa exterior),
`gym` (GymScreen / interior gimnasio), `battle` (BattleScreen), `capture`
(CaptureScreen), `evolution` (EvolutionScreen), `home` (HomeScreen / casa),
`pokemon_center`, `pokemon_shop`, `profile`, `agenda`, `shop`, `bag`, `friends`,
`pokedex`, `worldmap` (WorldMapScreen), `admin`.

### Multijugador

Amigos por nombre de usuario; los amigos conectados aparecen como sprites en el mapa,
posición actualizada vía `POST /mapa/posicion`.

## 7. Convenciones del juego

- **Controles:** flechas para mover, Z para interactuar/confirmar, B para
  cancelar/salir.
- **Rejilla:** tiles de 32 × 32 px; el personaje se mueve por esa rejilla.
- **Transición entre mapas:** efecto iris (círculo que se cierra y abre) estilo GBC.
  Al entrar a un interior se recuerda la posición exterior y al salir se vuelve a
  ella.
- **Hora del día:** `GameContext` expone `timeOfDay` (`morning`/`midday`/`day`/`night`)
  basado en la hora real; los mapas pueden usarlo para tintes de paleta.
- **Interiores:** componente `InteriorMap` (`react-app/src/components/InteriorMap.jsx`),
  también basado en canvas; los pisos se conectan con escaleras.
- **NPCs:** diálogos dinámicos según el progreso del día.
- **Guardias de ruta:** pueden bloquear el paso hasta cumplir una condición (p. ej.
  haber completado al menos un hábito).
- **Panel de administración** (`/admin`, solo rol admin): activar/desactivar
  gimnasios, editar hábitos, definir el Pokémon de cada gimnasio, guardar presets.
  Los cambios van a la BD y aplican de inmediato vía `POST /admin/config`.

## 8. Cómo encajar contenido nuevo

Regla general: **mejorar y ampliar, no rehacer**. Lo nuevo debe seguir el formato, la
nomenclatura y el estilo de lo existente. Antes de producir, mira el código real del
proyecto para copiar el patrón exacto.

### Nuevo Pokémon (especie)

1. Añade una entrada a `POKEMON_SPECIES` en `pokemonData.js`:
   `'NNN': { name, types: [...], baseStats: { hp, atk, def, spa, spd, spe } }`.
   El ID es un string de 3 dígitos con cero.
2. Añade su moveset a `POKEMON_MOVES` con clave entera (sin cero).
3. Si evoluciona, añade la cadena a `EVOLUTION_DATA` en `evolutionData.js`.
4. Aporta sprites frontal y trasero de 32 × 32 px en estilo Cristal:
   `react-app/public/Graphics/battlers/NNN.png` (frontal del enemigo) y
   `react-app/public/Graphics/battlers/NNN_back.png` (trasero del jugador).
5. Si es recompensa de un gimnasio: añádelo a `GYM_LEADER_POKEMON` en `pokemonData.js`
   Y a `pokemon_template` en la BD (gym_id, pokemon_id, nombre, nivel, orden_en_gym).

### Nuevo movimiento

1. Añade una entrada a `MOVE_DATA` en `moveData.js` con los campos:
   `id`, `nombre` (español), `power`, `accuracy`, `type`, `category`
   (`physical`/`special`/`status`), `priority`, y opcionalmente `effect`,
   `effectChance`, `recoil`, `critBoost`.
2. Si tiene efecto secundario nuevo, impleméntalo en `moveEffects.js`.
3. Añádelo a los movesets relevantes en `POKEMON_MOVES`.

### Nuevo gimnasio

1. **BD:** fila en `gimnasios_template` + filas de hábitos en `habitos_template` +
   fila(s) en `pokemon_template` (equipo del líder).
2. **Frontend `gymData.js`:** entrada en `GYM_CONFIGS` con la clave del mapa interior
   (`MapXXX`), tileset, líder, diálogo, tiles y función generadora de mapa; registra
   el generador en `GENERATORS`.
3. **Frontend `pokemonData.js`:** entrada en `GYM_LEADER_POKEMON` (puede ser un objeto
   `{id, level}` o un array para equipos de varios Pokémon).
4. **Frontend `worldData.js`:** añade el edificio del gimnasio al mapa exterior
   correspondiente con `type: 'gym'`, `gymId` (gym_id de la BD) y `targetMapId`
   (clave del interior en GYM_CONFIGS).
5. Debe quedar configurable desde `/admin`.

### Nuevo mapa exterior

1. Añade una entrada en `WORLD_DATA` de `worldData.js` con el objeto del mapa:
   `nombre`, `npcs`, `buildings`, `exits`. Nómbralo `MapXXX`.
2. Conéctalo por bordes (`exits`) a los mapas vecinos y añade la vuelta en esos mapas.
3. Define encuentros salvajes si procede (tabla de Pokémon y niveles).
4. El tileset exterior y el tile-walking los gestiona `CityScreen.jsx`.

### Nueva animación de combate

Impleméntala en `battleAnimations.js` siguiendo los tipos `ANIM_TYPES` existentes.
Ver `references/animations.md` para el modelo de máquina de estados sobre canvas.
