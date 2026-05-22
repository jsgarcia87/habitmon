# El proyecto Habitmon

Referencia del proyecto **real**. Léela siempre antes de crear o modificar contenido:
describe cómo está construido Habitmon, qué existe ya y cómo encajar lo nuevo. El
objetivo es **mejorar y ampliar** el juego, respetando esta base.

## Índice

1. Qué es Habitmon
2. Stack tecnológico
3. Modelo de datos (MySQL)
4. La API REST
5. Contenido que ya existe
6. Convenciones del juego
7. Cómo encajar contenido nuevo

---

## 1. Qué es Habitmon

RPG de hábitos diarios inspirado en Pokémon Cristal. El jugador completa tareas
reales del día (vestirse, desayunar, hacer ejercicio...) para desbloquear batallas
contra líderes de gimnasio y hacer crecer a su Pokémon compañero. Ciclo diario:
hacer los hábitos en la vida real → marcarlos en el juego → retar al gimnasio
correspondiente → ganar la medalla → el Pokémon sube de nivel → al día siguiente se
reinicia. Los usuarios finales son niños.

## 2. Stack tecnológico

- **Frontend:** React + Vite (SPA con rutas manejadas por estado). Estado global en
  un `GameContext` (React Context).
- **Renderizado:** Canvas 2D con `requestAnimationFrame`. Mapas y batallas se dibujan
  en canvas, no son DOM.
- **Gráficos:** tiles de **32 × 32 px**, arte de RPG Maker XP (RMXP) adaptado. Fuente
  Press Start 2P.
- **Backend:** PHP, API REST en `hb_api/index.php`.
- **Base de datos:** MySQL relacional.
- **Autenticación:** Bearer token guardado en `localStorage`.

**Importante:** Habitmon **no se ejecuta sobre RPG Maker ni Pokémon Essentials**.
RMXP se usa como **fuente de arte** (tilesets, sprites) y probablemente como editor
para diseñar mapas que luego se exportan/convierten a JSON. El runtime es la app web
React + Canvas. El contenido del juego vive en **MySQL**, no en archivos PBS. Cuando
generes código, hazlo para este stack (React/Canvas en frontend, PHP/MySQL en
backend).

## 3. Modelo de datos (MySQL)

| Tabla | Contenido |
| --- | --- |
| `usuarios` | Cuentas, avatar, monedas, inventario |
| `habitos` | Registro diario de hábitos por usuario y fecha |
| `habitos_template` | Configuración maestra de hábitos |
| `gimnasios_template` | Configuración de gimnasios |
| `pokemon_template` | Pokémon de cada gimnasio (la "pokédex" del juego) |
| `pokemon_coleccion` | Pokémon que ha conseguido cada usuario |
| `progreso_diario` | Medallas conseguidas cada día |
| `amigos` | Relaciones de amistad entre usuarios |
| `usuario_posicion` | Posición actual en el mapa (multijugador) |

Distinción clave: las tablas `*_template` guardan la **definición/configuración del
contenido del juego**; las demás guardan **datos por usuario**. Para "crear contenido
nuevo" casi siempre se toca una tabla `_template`.

## 4. La API REST

Base: `hb_api/index.php`. Endpoints confirmados en la guía del juego:

- `GET /habitos/hoy` — hábitos del día; sincroniza con la configuración activa e
  inserta los que falten para esa fecha.
- `POST /habitos/completar` — marca un hábito → +20 XP al compañero, +10 monedas.
- `POST /gimnasios/completar` — victoria de gimnasio → medalla + Pokémon + 120
  monedas.

Existen más endpoints (registro/login, colección, amigos, posición). Antes de añadir
o cambiar uno, **revisa `hb_api/index.php`** y sigue el patrón existente.

## 5. Contenido que ya existe

### Mapas

| Mapa | Nombre |
| --- | --- |
| Map002 | Pueblo Primavera (inicio) |
| Map008 | Ruta 29 |
| Map029 | Ciudad Crono |
| Map070 | Ciudad Fronsaf |
| Map010 | Ruta 30 / área norte |
| Interiores | Casa, gimnasios, Centro Pokémon, Tienda |

Nomenclatura `MapXXX`, heredada de RMXP. Mantén ese formato para mapas nuevos.

### Gimnasios / categorías de hábito (6)

Vestimenta, Desayuno, Higiene, Orden, Comida, Fitness. Cada gimnasio es una categoría
de hábitos + un líder (sprite, nombre, Pokémon) + un edificio en el mapa. Se reta al
líder al completar todos los hábitos de su categoría en el día.

### Economía y progresión

- Inicio: 300 monedas, 5 Pokéballs, 2 Pociones, un starter elegido entre varios, un
  avatar entre 4.
- Completar un hábito: +20 XP al compañero, +10 monedas. Ganar una batalla: +10 XP.
- Subir de nivel: al alcanzar 100 XP (el contador se reinicia).
- Ganar un gimnasio: +120 monedas y un Pokémon temático a la colección.

### Combate (Gen 2 Cristal)

Por turnos. Fórmula de daño:

```
daño = ((2 × nivel / 5 + 2) × poder × ataque / defensa) / 50 + 2
```

Modificadores: STAB ×1.5; efectividad de tipo ×0/×0.5/×1/×2; crítico ×1.5 (6.25 %, o
25 % en movimientos de alta crítica); factor aleatorio 0.85–1.0; quemadura ÷2 en
físicos; pantallas (Reflect/Light Screen) ÷2; clima ±50 % en Agua/Fuego. Orden de
turno: primero prioridad, luego velocidad; la parálisis reduce la velocidad un 75 %.
Estados: sueño, congelación, parálisis, confusión, veneno. Captura: Pokéball 45 %,
Superball 70 %.

Estadísticas del compañero por nivel:

```
HP máximo  = (HP base × nivel / 25) + nivel + 10
Ataque/Def = (stat base × nivel / 50) + 5
```

### Multijugador

Amigos por nombre de usuario; los amigos conectados aparecen como sprites en el mapa,
sincronizados cada 4 segundos.

## 6. Convenciones del juego

- **Controles:** flechas para mover, Z para interactuar/confirmar, B para
  cancelar/salir.
- **Rejilla:** tiles de 32 × 32 px; el personaje se mueve por esa rejilla.
- **Transición entre mapas:** efecto iris (círculo que se cierra y abre) estilo GBC.
  Al entrar a un interior se recuerda la posición exterior y al salir se vuelve a
  ella.
- **Interiores:** componente `InteriorMap`, también basado en canvas; los pisos se
  conectan con escaleras.
- **NPCs:** diálogos dinámicos según el progreso del día.
- **Guardias de ruta:** pueden bloquear el paso hasta cumplir una condición (p. ej.
  haber completado al menos un hábito).
- **Panel de administración** en `/admin` (solo rol admin): activar/desactivar
  gimnasios, editar hábitos, definir el Pokémon de cada gimnasio, guardar presets.
  Los cambios van a la BD y aplican de inmediato.

## 7. Cómo encajar contenido nuevo

Regla general: **mejorar y ampliar, no rehacer**. Lo nuevo debe seguir el formato, la
nomenclatura y el estilo de lo existente. Antes de producir, mira el código real del
proyecto para copiar el patrón exacto.

- **Nuevo Pokémon:** fila en `pokemon_template` (especie, tipo, estadísticas base,
  moveset, evolución) + sprites frontal y trasero de 32 × 32 px en estilo Cristal. Si
  es recompensa de un gimnasio, enlázalo a ese gimnasio.
- **Nuevo movimiento:** añádelo a la estructura de movimientos que use el motor de
  combate (revisa cómo están definidos los movimientos actuales) con tipo, categoría,
  poder, precisión, PP y efecto, compatibles con la fórmula de daño Gen 2.
- **Nuevo gimnasio:** fila en `gimnasios_template` + sus hábitos en
  `habitos_template` + el Pokémon del gimnasio en `pokemon_template` + un líder
  (sprite y nombre) + un edificio en un mapa. Debe quedar configurable desde `/admin`.
- **Nuevo mapa:** diséñalo (en RMXP o como datos JSON), nómbralo `MapXXX`, conéctalo
  por bordes y/o warps a los mapas vecinos, define su tabla de encuentros e intégralo
  en el sistema de mapas del canvas.
- **Nueva animación:** impleméntala en el motor de canvas/React siguiendo las
  animaciones existentes (intro de batalla, evolución, transición iris).
