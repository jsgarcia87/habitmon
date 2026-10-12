# Guía de Convivencia y Desarrollo del Agente — Habitmon

> **Documento maestro de desarrollo para asistentes de IA (Claude Code, Antigravity, Cursor, etc.) y desarrolladores.**  
> Este archivo define la arquitectura del proyecto, las fuentes de verdad y el protocolo de colaboración para que múltiples agentes de IA puedan trabajar sobre la misma base de código sin pisarse, sin rehacer trabajo ajeno y manteniendo la máxima coherencia técnica y estética.

---

## 1. Visión y Esencia del Proyecto

**Habitmon** es un RPG de hábitos diarios web inspirado fielmente en **Pokémon Cristal (Game Boy Color, Gen 2)**.
- **Mecánica central:** El jugador completa hábitos y tareas reales de su día a día (vestirse, desayunar, higiene, ordenar, etc.) para desbloquear batallas contra líderes de gimnasio y entrenar a su Pokémon compañero.
- **Audiencia objetivo:** Niños y jóvenes. El tono visual y narrativo debe ser siempre **acogedor, claro, amigable y poco intimidante**.
- **Principio de fidelidad:** El listón de comportamiento y mecánicas es el juego original de Pokémon Cristal (documentado canónicamente en el desensamblado `pokecrystal` del proyecto *pret*). Todo el pixel art, animaciones, cálculos de daño y lógica de combate deben respetar ese estándar dentro del runtime web.

---

## 2. Protocolo de Convivencia Multi-IA (Claude + Antigravity + Otros)

Cuando varias IAs colaboran en este repositorio, deben seguir este protocolo estricto:

### 2.1 Memoria Compartida (`memory/`)
El directorio `memory/` es el registro histórico y la bitácora viva del proyecto:
- **`memory/MEMORY.md`**: Índice principal de temas y sesiones de trabajo.
- **Archivos temáticos** (ej: `memory/project_pokemon_improvements.md`): Contienen contexto detallado de lo que se ha implementado recientemente, decisiones técnicas tomadas y listas de pendientes.

> [!IMPORTANT]
> **Regla de sincronización obligatoria para toda IA:**
> 1. **Al iniciar cualquier sesión o tarea:** Lee siempre `memory/MEMORY.md` y los archivos vinculados antes de proponer cambios para entender en qué punto quedó la última IA.
> 2. **Al finalizar o pausar una tarea:** Actualiza el archivo correspondiente en `memory/` (o crea uno nuevo si es una iniciativa distinta) y registra:
>    - Qué se completó exactamente.
>    - Archivos modificados y decisiones clave.
>    - Qué tareas quedan pendientes para la siguiente sesión.
> 3. Mantén el índice en `memory/MEMORY.md` siempre al día.

### 2.2 Referencias Técnicas Compartidas (`.claude/skills/habitmon/references/`)
En `.claude/skills/habitmon/references/` existen guías profundas redactadas para el proyecto. **Cualquier IA debe consultarlas** como estándar normativo:
- **`habitmon-project.md`**: Referencia general del proyecto real, modelos de base de datos, APIs y flujo.
- **`pokecrystal-reference.md`**: Desensamblado de Pokémon Cristal (fórmulas, eventos, estados, prioridades).
- **`crystal-style.md`**: Reglas de pixel art, resolución, paletas de GBC (4 colores por tile) y rejilla.
- **`pokemon-and-moves.md`**: Estructura de especies, movimientos, categorías y tablas de tipos.
- **`animations.md`**: Animaciones de combate en Canvas 2D.
- **`world-maps-scenarios.md`**: Creación de ciudades, rutas, interiores, edificios y conexiones.

### 2.3 Principio "Ampliar y Mejorar, No Rehacer"
- Nunca sustituyas una funcionalidad existente con librerías externas o reescrituras masivas sin que el usuario lo solicite expresamente.
- Construye incrementalmente sobre los archivos y patrones existentes (ej. el sistema typewriter y avance con botón A ya implementado en `BattleScreen.jsx`).
- Respeta los comentarios de código, la arquitectura actual y las convenciones de nomenclatura.

### 2.4 Control de Versiones y Estado Limpio
- Revisa el estado de git (`git status`) antes de editar para no sobrescribir cambios sin guardar.
- No dejes archivos temporales o de prueba en la raíz o en directorios del proyecto; usa `memory/` o scratch según corresponda.

---

## 3. Stack Tecnológico y Entornos

| Capa | Tecnologías | Notas Clave |
|---|---|---|
| **Frontend** | React 19, Vite, Canvas 2D HTML5 | SPA gestionada por estado en `App.jsx`. Gráficos dibujados en Canvas con `requestAnimationFrame`. Fuente `Press Start 2P`. |
| **Backend (Prod)** | PHP (Vanilla), MariaDB / MySQL | Ubicado en `hb_api/`. Enrutamiento mediante query param `?route=/dominio/accion`. Autenticación JWT Bearer token en `localStorage` (`hm_token`). |
| **Backend (Dev/Local)** | Python / Flask, Flask-SQLAlchemy, JWT | `app.py` en la raíz. Contiene un shim de compatibilidad `/hb_api/index.php` para responder a las llamadas del frontend localmente. |
| **Gráficos** | Tilesets 32×32 px (fuente RPG Maker XP adaptada a estilo GBC) | Ubicados en `Graphics/` y `react-app/public/Graphics/`. |
| **Build & Release** | Bash script (`./release.sh`) | Compila React y genera la carpeta de distribución `habitmon_release/`. |

> [!CAUTION]
> **NUNCA modifiques archivos directamente dentro de `habitmon_release/`**. Esa carpeta es un artefacto generado automáticamente por `./release.sh`. Cualquier cambio debe realizarse en el código fuente (`react-app/`, `hb_api/`, `app.py`, `Data/`, `Graphics/`).

---

## 4. Mapa de Datos y Fuentes de Verdad

Para evitar inconsistencias entre IAs, esta tabla especifica exactamente dónde reside cada pieza de información:

### 4.1 Frontend (`react-app/src/data/`)
- **Especies y Stats Base**: [`react-app/src/data/pokemonData.js`](react-app/src/data/pokemonData.js)
  - `POKEMON_SPECIES`: Diccionario `{ 'NNN': { name, types, baseStats: { hp, atk, def, spa, spd, spe } } }`. Claves son strings de 3 dígitos con relleno de ceros (ej. `'016'`, `'025'`).
  - `GYM_LEADER_POKEMON`: Equipos y Pokémon asignados a los líderes de gimnasio.
  - Funciones utilitarias: `createBattlePokemon()`, `getPokemonByGym()`.
- **Movimientos y Movesets**: [`react-app/src/data/moveData.js`](react-app/src/data/moveData.js)
  - `MOVE_DATA`: Definición de ataques (id, nombre en español, poder, precisión, tipo, categoría `physical`/`special`/`status`, prioridad, efectos).
  - `POKEMON_MOVES`: Movesets de cada criatura indexados por número entero (ej. `16`, `25`).
- **Evoluciones**: [`react-app/src/data/evolutionData.js`](react-app/src/data/evolutionData.js)
  - `EVOLUTION_DATA`: Cadenas de evolución por nivel y métodos (`getEvolution`).
- **Gimnasios e Interiores**: [`react-app/src/data/gymData.js`](react-app/src/data/gymData.js) e [`interiorData.js`](react-app/src/data/interiorData.js)
  - `GYM_CONFIGS`: Configuración procedural de cada gimnasio (tilesets, líder, diálogos, tiles de suelo/pared, generadores de obstáculos temáticos).
  - Generadores en `GENERATORS` (vestirse, higiene, orden, comida, desayuno, fitness).
- **Mundo Exterior (Overworld)**: [`react-app/src/data/worldData.js`](react-app/src/data/worldData.js)
  - `WORLD_DATA`: Edificios, salidas (`exits`), NPCs y puntos de transición de mapas `MapXXX`.

### 4.2 Lógica de Combate (`react-app/src/utils/`)
- [`battleEngine.js`](react-app/src/utils/battleEngine.js): Gestión de turnos, orden por prioridad/velocidad y estados alterados.
- [`damageCalculator.js`](react-app/src/utils/damageCalculator.js): Fórmulas de daño oficiales Gen 2, tabla de tipos y modificadores (STAB, crítico 6.25%, clima, pantallas, quemadura).
- [`moveEffects.js`](react-app/src/utils/moveEffects.js): Lógica de efectos secundarios de movimientos (reducciones de stats, retroceso, drenaje, veneno, parálisis, etc.).
- [`battleAnimations.js`](react-app/src/utils/battleAnimations.js): Motor de animaciones de ataques sobre Canvas.

### 4.3 Base de Datos (`habitmon_setup.sql`)
- **Tablas de plantilla / configuración del juego:**
  - `habitos_template`: Definición de hábitos (id, pokemon_template_id, nombre, daño, icono, obligatorio, activo).
  - `gimnasios_template`: Gimnasios activos, tiempo, orden.
  - `pokemon_template`: Qué Pokémon entrega/combate cada gimnasio y a qué nivel.
  - `habito_presets`: Ajustes preconfigurados guardados por administradores.
- **Tablas de usuario:**
  - `usuarios`, `habitos`, `pokemon_coleccion`, `progreso_diario`, `amigos`, `usuario_posicion`.

---

## 5. Convenciones de Código y Buenas Prácticas

### 5.1 En el Frontend (React + Canvas)
- **Evitar Stale Closures en Combate Asíncrono:** En `BattleScreen.jsx`, los turnos y diálogos utilizan `async/await` y Promises (por ejemplo `showMessage(text)` que espera la pulsación de A). Usa referencias mutables (`useRef`, como `enemyPkmnRef`) para leer siempre el HP y estado actual de los combatientes sin depender de closures congeladas de React.
- **Controles Universales del Juego:**
  - `↑ ↓ ← →` o D-Pad: Movimiento del avatar / navegación de menús.
  - `Z` o Botón `A`: Confirmar, interactuar con NPCs, avanzar mensajes / saltar typewriter.
  - `B`: Cancelar menú, salir de interiores.
- **Renderizado de Pixel Art:** Las imágenes en canvas y elementos DOM deben preservar los bordes nítidos (`image-rendering: pixelated`). Escalado siempre con múltiplos enteros sobre la base de tiles de 32×32 px.

### 5.2 En los Backends (PHP & Flask)
- Toda respuesta de la API REST debe ser un objeto JSON consistente con `{ success: true, ... }` o `{ success: false, error: "mensaje" }`.
- Si se añade un nuevo endpoint o parámetro a la API PHP (`hb_api/index.php`), asegúrate de replicar la compatibilidad en `app.py` (`php_shim`) si se desea mantener el soporte en desarrollo local con Flask.

---

## 6. Estado Actual y Hoja de Ruta Inmediata

Consulta siempre `memory/project_pokemon_improvements.md` para el detalle exhaustivo. Resumen del estado:

### ✅ Completado Recientemente
- **Typewriter y avance con botón A en batalla:** Mensajes letra a letra (28ms), cursor parpadeante `▼`, avance/salto con tap o botón A, resolución asíncrona mediante Promise, `enemyPkmnRef` para evitar closures obsoletas.
- **Generadores temáticos de gimnasios:** Diseños procedurales específicos para Vestirse, Higiene, Orden, Comida, Desayuno y Fitness, manteniendo el pasillo central libre (x=9, 10).

### ⏳ Pendientes / Prioridades de Combate Clásico
1. **Menú de movimientos enriquecido:** Mostrar el Tipo de cada ataque con su color temático y los PP restantes / máximos.
2. **Sistema de PP completo:** Restar PP al ejecutar ataques y gestionar el agotamiento de movimientos (actualmente son infinitos).
3. **Barra de HP animada:** Drenaje tick por tick con sonido/timing al estilo Gen 1/2.
4. **Barra de EXP animada:** Visible en el HUD del jugador con animación progresiva al ganar experiencia.
5. **Secuencia de subida de nivel:** Pantalla de estadísticas mejoradas una a una tras la batalla.

---

## 7. Comandos de Trabajo Habituales

### Desarrollo Frontend
```bash
cd react-app
npm install      # Instalar dependencias si no existen
npm run dev      # Servidor de desarrollo Vite (proxy configurado a localhost:8080)
npm run build    # Compilación de producción en react-app/dist
```

### Backend de Desarrollo Local (Flask)
```bash
pip install -r requirements.txt
python app.py    # Levanta el servidor local Flask con soporte para php_shim
```

### Generación de Release
```bash
./release.sh     # Limpia, compila React, copia assets y genera habitmon_release/
```

---

*Cualquier IA que lea este archivo debe actuar como un compañero de equipo continuo y respetuoso con el trabajo previo.*
