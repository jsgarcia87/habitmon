# Pokémon y ataques

Guía para crear las criaturas de Habitmon y sus ataques: especies completas con
estadísticas, tipos, habilidades, evoluciones y **movesets**, y la definición de
movimientos con sus efectos. Antes de usarla, lee `habitmon-project.md` (los Pokémon
viven en la tabla `pokemon_template`; el combate usa la fórmula de daño de Gen 2).

## Índice

1. Anatomía de una especie Pokémon
2. Estadísticas base y equilibrio
3. Tipos
4. Habilidades
5. Evoluciones
6. Movesets: qué movimientos aprende
7. Anatomía de un movimiento
8. Diseñar el efecto de un movimiento
9. Cómo se definen en Habitmon
10. Listas de comprobación

---

## 1. Anatomía de una especie Pokémon

Una especie bien definida necesita, como mínimo:

- **Identificador** y **nombre** mostrado.
- **Tipo(s):** uno o dos.
- **Estadísticas base:** PS, Ataque, Defensa, At. Especial, Def. Especial, Velocidad.
- **Habilidad(es).**
- **Moveset:** movimientos que aprende y a qué nivel.
- **Evolución(es):** a qué especie y por qué método.
- **Datos de Pokédex:** categoría, altura, peso, color, descripción.
- **Sprites:** frontal y trasero, de 32 × 32 px, en estilo Cristal.

## 2. Estadísticas base y equilibrio

- Las seis estadísticas definen el papel de la criatura: mucho Ataque y Velocidad =
  ofensiva rápida; mucha Defensa y PS = muro.
- Mantén un **total de estadísticas base coherente** con la etapa evolutiva: las
  primeras etapas son flojas, las finales fuertes. No mezcles una etapa base con un
  total propio de etapa final.
- Evita criaturas que lo hagan todo bien. Una debilidad clara hace el diseño más
  interesante y el juego más justo.
- En Habitmon las estadísticas reales en combate se derivan del nivel con las
  fórmulas del proyecto (ver `habitmon-project.md`); las estadísticas **base** son la
  semilla de ese cálculo, así que ajústalas pensando en cómo se sentirá la criatura a
  nivel bajo y a nivel alto.
- Público infantil: dificultad **suave**; ninguna criatura debe ser frustrante ni
  trivial.

## 3. Tipos

- Los tipos determinan ventajas y desventajas; el combate aplica una efectividad de
  ×0, ×0.5, ×1 o ×2.
- Gen 2 añadió **Siniestro** y **Acero** a los tipos originales.
- Un tipo doble combina las relaciones de ambos: puede crear debilidades dobles (×4)
  o resistencias fuertes.
- El STAB (×1.5) premia usar movimientos del propio tipo: tenlo en cuenta al asignar
  tipo y moveset.
- Elige los tipos por **tema y coherencia visual**, no al azar.

## 4. Habilidades

- Una habilidad es un efecto pasivo. Asigna habilidades **coherentes con el tema** de
  la criatura.
- Empieza por un repertorio pequeño y reutilizable de habilidades; cada una es un
  identificador con su lógica asociada en el motor de combate.
- Comprueba qué habilidades soporta ya el combate del proyecto antes de inventar una
  nueva.

## 5. Evoluciones

Define para cada evolución la **especie destino** y el **método**. Métodos típicos:
por nivel, por objeto, por felicidad/amistad, por condición especial.

En Habitmon la evolución del compañero se activa **al alcanzar cierto nivel**, justo
después de una batalla o subida de nivel, con su animación propia (ver
`animations.md`). Prefiere métodos **claros y alcanzables**: la evolución es un hito y
debe sentirse como una recompensa, no como un acertijo.

## 6. Movesets: qué movimientos aprende

El moveset de una especie tiene varias vías posibles:

- **Por nivel:** lista de movimientos con el nivel al que se aprenden. Es la columna
  vertebral; ordénala de menor a mayor nivel.
- **Otras vías** (máquinas, crianza, tutor) según lo que soporte el proyecto.

Diseña el moveset por nivel pensando en cómo se juega la criatura a lo largo de la
partida: que a nivel bajo tenga algo útil y vaya ganando opciones. Cubre su tipo y da
variedad (ataque, estado, utilidad). Recuerda que en combate el jugador maneja **4
movimientos** a la vez.

## 7. Anatomía de un movimiento

Un movimiento/ataque se define con:

- **Identificador** y **nombre.**
- **Tipo.**
- **Categoría:** Físico, Especial o Estado.
- **Potencia:** 0 para movimientos de estado.
- **Precisión:** porcentaje.
- **PP:** usos disponibles.
- **Prioridad:** orden de actuación dentro del turno.
- **Objetivo:** rival, propio, etc.
- **Efecto:** qué hace además del daño.
- **Probabilidad del efecto secundario**, si lo tiene.
- **Descripción.**

## 8. Diseñar el efecto de un movimiento

> Para fidelidad real, lee `pokecrystal-reference.md` §5: en Cristal un movimiento se
> ejecuta como una **secuencia de comandos de efecto** (un movimiento de daño encadena
> `critical` → `damagestats` → `stab` → `damagevariation` → `checkhit` →
> `applydamage`...). El motor de combate de Habitmon debería construir cada ataque
> combinando comandos de un catálogo, no como una función monolítica.

- La mayoría de movimientos hacen daño según la **fórmula de Gen 2** del proyecto,
  con potencia, ataque/defensa, STAB y efectividad de tipo.
- Los movimientos de **estado** no hacen daño: alteran estadísticas, infligen estados
  (sueño, congelación, parálisis, confusión, veneno), curan o protegen. Habitmon ya
  implementa esos cinco estados; reutilízalos.
- Los **efectos secundarios** son extras con cierta probabilidad (p. ej. "10 % de
  paralizar").
- Equilibra potencia y precisión: un movimiento muy potente suele tener menos
  precisión, menos PP o un inconveniente.
- Público infantil: efectos legibles y pocos a la vez. Un niño debe entender qué hizo
  su ataque.

## 9. Cómo se definen en Habitmon

El contenido de Pokémon está **repartido entre el frontend JS y la BD MySQL**:

### Especie (datos biológicos)

Vive en **`react-app/src/data/pokemonData.js`**, objeto `POKEMON_SPECIES`:

```js
'NNN': { name: 'Nombre', types: ['TIPO1'], baseStats: { hp, atk, def, spa, spd, spe } }
```

- La clave es un string de 3 dígitos con cero (`'016'`, `'025'`).
- `types` usa los nombres en mayúsculas del tipo chart de `damageCalculator.js`
  (NORMAL, FIRE, WATER, GRASS, ELECTRIC, ICE, FIGHTING, POISON, GROUND, FLYING,
  PSYCHIC, BUG, ROCK, GHOST, DRAGON, DARK, STEEL).
- Los sprites van en `react-app/public/Graphics/battlers/NNN.png` (frontal) y
  `NNN_back.png` (trasero).

### Moveset

En `POKEMON_MOVES` del mismo archivo, con **clave entera sin cero** (`16`, `25`):

```js
16: ['TACKLE', 'SAND_ATTACK', 'GUST', 'WING_ATTACK']
```

### Evoluciones

En `react-app/src/data/evolutionData.js`, objeto `EVOLUTION_DATA`:

```js
'NNN': { next: 'MMM', level: 18 }
```

### Asignación a gimnasio (qué Pokémon usa el líder)

Dos pasos:
1. **`GYM_LEADER_POKEMON`** en `pokemonData.js` — puede ser un objeto `{id, level}`
   para un solo Pokémon, o un **array** para un equipo de varios:
   ```js
   'vestirse': [{ id: '052', level: 5, name: 'Quitar Ropa' }, { id: '053', level: 8 }]
   'higiene':  { id: '088', level: 8 }
   ```
2. **`pokemon_template`** en la BD — fila con `gym_id, pokemon_id, nombre, nivel,
   orden_en_gym`. Si el líder tiene equipo, añade una fila por Pokémon con
   `orden_en_gym` 1, 2, etc.

### Movimientos

Viven en **`react-app/src/data/moveData.js`**, objeto `MOVE_DATA`. Añade el nuevo
movimiento con:

```js
'MOVE_ID': { id, nombre, power, accuracy, type, category, priority,
             effect?, effectChance?, recoil?, critBoost? }
```

`category`: `'physical'`, `'special'` o `'status'`. Si el efecto es nuevo,
impleméntalo en `moveEffects.js` (función `executeMoveEffect`).

Comprueba siempre la **versión real de las estructuras** antes de escribir: replica
el formato exacto de los elementos existentes.

## 10. Listas de comprobación

**Una especie está bien definida si:**

- Tiene tipo, las seis estadísticas base, habilidad(es) y datos de Pokédex.
- El total de estadísticas encaja con su etapa evolutiva.
- Tiene al menos una debilidad clara.
- Su moveset por nivel cubre su tipo y da variedad.
- Sus evoluciones tienen especie destino y método definidos.
- Tiene sprites frontal y trasero de 32 × 32 en estilo Cristal.
- El diseño es amable y apropiado para público infantil.
- Tiene entrada en `POKEMON_SPECIES` (pokemonData.js) con las 6 estadísticas base.
- Si es recompensa de gimnasio, tiene entrada en `GYM_LEADER_POKEMON` (pokemonData.js)
  y en `pokemon_template` (BD).

**Un movimiento está bien definido si:**

- Tiene tipo, categoría, potencia (0 si es de estado), precisión, PP y objetivo.
- Su efecto es claro, equilibrado y compatible con el combate Gen 2 del proyecto.
- Encaja temáticamente con las criaturas que lo aprenden.
- Sigue el formato de los movimientos ya existentes.
