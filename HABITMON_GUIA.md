# Habitmon — Guía del Juego

Habitmon es un RPG de hábitos diarios inspirado en Pokémon Crystal. El jugador completa tareas reales del día a día (vestirse, desayunar, hacer ejercicio...) para desbloquear batallas contra líderes de gimnasio y hacer crecer a su Pokémon compañero.

---

## Índice

1. [Registro e inicio](#1-registro-e-inicio)
2. [Pantalla principal (Ciudad)](#2-pantalla-principal-ciudad)
3. [Hábitos diarios](#3-hábitos-diarios)
4. [Gimnasios](#4-gimnasios)
5. [El sistema de combate](#5-el-sistema-de-combate)
6. [Tu Pokémon compañero](#6-tu-pokémon-compañero)
7. [Colección de Pokémon](#7-colección-de-pokémon)
8. [Navegación y mapas](#8-navegación-y-mapas)
9. [Elementos multijugador](#9-elementos-multijugador)
10. [Panel de administración](#10-panel-de-administración)
11. [Arquitectura técnica resumida](#11-arquitectura-técnica-resumida)

---

## 1. Registro e inicio

### Crear una cuenta

Al entrar por primera vez se muestra la pantalla de login. El jugador puede registrarse con:

- **Nombre de usuario** (único)
- **Correo electrónico** (único)
- **Contraseña**
- **Avatar** — uno de 4 sprites disponibles

Al registrarse, el jugador recibe:
- 300 monedas iniciales
- Inventario de partida: 5 Pokéballs y 2 Pociones

### Elegir el Pokémon inicial (Starter)

Después del registro, antes de acceder al mundo, el jugador elige su **Pokémon compañero** entre varias opciones. Este Pokémon:

- Será el que combata en todos los gimnasios
- Ganará XP y subirá de nivel con cada hábito completado y batalla ganada
- Puede evolucionar cuando acumule suficiente experiencia

---

## 2. Pantalla principal (Ciudad)

La pantalla principal es un mapa de ciudad de vista cenital con gráficos estilo Game Boy Color (tiles 32×32 píxeles). El jugador se mueve con las teclas de dirección.

### Interacciones

| Tecla | Acción |
|-------|--------|
| ↑ ↓ ← → | Mover al personaje |
| Z | Interactuar / confirmar |
| B | Cancelar / salir de interior |

### Elementos del mapa

- **NPCs** — Personajes con los que hablar. El mensaje del NPC cambia dinámicamente según el progreso del día (te dirá qué gimnasio te falta, te felicitará si completaste todo, etc.).
- **Edificios de Gimnasio** — Entrar a uno inicia el flujo de batalla.
- **Casa del jugador** — Contiene a la madre, que puede curar al Pokémon, y el acceso al piso superior.
- **Centro Pokémon / Tienda** — NPCs de apoyo (Enfermera Joy, Dependiente).
- **Salidas del mapa** — Caminar hasta el borde del mapa lleva a otra zona.

### Guardia de la Ruta

Al oeste del Pueblo Primavera hay un guardia que bloquea el paso a la Ruta 29. Solo deja pasar al jugador si ha completado **al menos un hábito** del día.

---

## 3. Hábitos diarios

Los hábitos son la mecánica central del juego. Cada día, el sistema genera una lista de tareas basada en los gimnasios activos configurados por el administrador.

### Estructura

Cada hábito pertenece a un **gimnasio** (categoría):

| Gimnasio | Categoría |
|----------|-----------|
| Vestimenta | Vestirse |
| Desayuno | Comer por la mañana |
| Higiene | Lavarse, ducharse |
| Orden | Ordenar, limpiar |
| Comida | Almuerzo / Cena |
| Fitness | Ejercicio |

### Cómo completar un hábito

El jugador marca el hábito como completado en su lista diaria. Al hacerlo:

- Su Pokémon compañero recibe **+20 XP**
- El jugador recibe **+10 monedas**
- Si el Pokémon acumula 100 XP, **sube de nivel**

### Reset diario

Los hábitos se reinician automáticamente cada día. Al consultar la lista de hábitos del día, el sistema sincroniza con la configuración activa e inserta los que no existan para esa fecha.

---

## 4. Gimnasios

Cada gimnasio representa una categoría de hábitos. Para **retar al líder** del gimnasio el jugador debe haber completado todos los hábitos de esa categoría durante el día.

### Entrar a un gimnasio

1. El jugador camina hacia el edificio del gimnasio en el mapa.
2. El juego verifica si tiene hábitos pendientes de ese gimnasio.
3. Si todos están completados: se puede acceder y retar al líder.
4. Si hay pendientes: se muestra un aviso indicando cuántos faltan.

### Líderes de gimnasio

Cada gimnasio tiene un líder con su propio sprite, nombre y Pokémon. Al hablar con el líder dentro del gimnasio, aparece un diálogo con las opciones **¡LUCHAR!** o **AHORA NO**.

### Recompensas por ganar

- Medalla del gimnasio registrada en el progreso diario
- Un Pokémon nuevo se añade a la colección del jugador
- **+120 monedas**

---

## 5. El sistema de combate

El combate es por turnos, inspirado en Pokémon Crystal (Gen 2), con animaciones de intro, sprites animados y efectos de tipo.

### Flujo de una batalla

```
Intro → VS Screen (si es líder) → Aparición del Pokémon → HUD → Selección → Turno → ...
```

#### Fases de la intro (batallas contra líderes)

1. **VS Screen** — Los entrenadores entran desde los lados, aparece el logo VS.
2. **Trainer Enter** — El entrenador lanza la Pokéball.
3. **Ball Fly / Ball Flash** — Animación de la bola en arco.
4. **Pokémon Appear** — El Pokémon aparece en silueta y se revela.
5. **HUD Slide** — Las barras de HP entran en pantalla.

#### Durante el combate

El jugador elige cada turno una de estas acciones:

| Acción | Descripción |
|--------|-------------|
| LUCHAR | Selecciona uno de los 4 movimientos del Pokémon |
| OBJETO | Usa una Poción o lanza una Pokéball (encuentros salvajes) |
| HUIR | Intenta escapar (solo en encuentros salvajes) |

### Cálculo de daño (fórmula Crystal Gen 2)

```
daño = ((2 × nivel / 5 + 2) × poder × ataque / defensa) / 50 + 2
```

Modificadores aplicados:

| Modificador | Efecto |
|-------------|--------|
| STAB | ×1.5 si el tipo del movimiento coincide con el del Pokémon |
| Efectividad de tipo | ×0, ×0.5, ×1, ×2 según tabla de tipos |
| Crítico | ×1.5 (probabilidad 6.25%, 25% en movimientos de alta crítica) |
| Aleatorio | Factor entre 0.85 y 1.0 |
| Quemadura | ÷2 en movimientos físicos |
| Pantallas | ÷2 (Reflect / Light Screen) |
| Clima | ±50% en tipos Agua/Fuego con lluvia/sol |

### Orden de turno

- Se compara la prioridad del movimiento primero.
- Si es igual, el Pokémon más rápido actúa antes.
- La parálisis reduce la velocidad en un 75%.

### Condiciones de estado

| Estado | Efecto |
|--------|--------|
| Sueño | El Pokémon no puede atacar (1-3 turnos) |
| Congelación | Inmovilizado hasta descongelarse |
| Parálisis | 25% de fallo + velocidad reducida |
| Confusión | 33% de golpearse a sí mismo |
| Veneno | Daño cada turno |

### Resultado de la batalla

- **Victoria vs líder** — Medalla + Pokémon nuevo + monedas
- **Victoria salvaje** — Opción de capturar al Pokémon (Pokéball 45%, Superball 70%)
- **Derrota** — Game Over, vuelve al mapa

---

## 6. Tu Pokémon compañero

El Pokémon compañero (starter) es el núcleo del progreso del jugador.

### Estadísticas

Las estadísticas se calculan en función del nivel:

```
HP máximo   = (HP base × nivel / 25) + nivel + 10
Ataque/Def  = (stat base × nivel / 50) + 5
```

### Experiencia y niveles

| Fuente | XP ganada |
|--------|-----------|
| Completar un hábito | +20 XP |
| Ganar una batalla | +10 XP |

Cuando el Pokémon alcanza **100 XP**, sube un nivel y el contador se reinicia.

### Evoluciones

Algunos Pokémon evolucionan al llegar a cierto nivel. La evolución se activa automáticamente después de una batalla o al subir de nivel. La animación muestra:

1. Flash de entrada
2. 3 destellos de transformación
3. Morph al nuevo sprite
4. Fanfare de celebración

---

## 7. Colección de Pokémon

Además del compañero, el jugador puede acumular Pokémon de dos formas:

- **Recompensa de medalla** — Al ganar en un gimnasio, se añade automáticamente un Pokémon temático.
- **Captura salvaje** — Durante encuentros aleatorios en rutas, se puede lanzar una Pokéball.

Cada Pokémon de la colección registra:
- Nombre y ID de especie
- Nivel y XP actuales
- Gimnasio o ruta de origen
- Fecha de captura

---

## 8. Navegación y mapas

### Mapas disponibles

| Mapa | Nombre |
|------|--------|
| Map002 | Pueblo Primavera (inicio) |
| Map008 | Ruta 29 |
| Map029 | Ciudad Crono |
| Map070 | Ciudad Fronsaf |
| Map010 | Ruta 30 / área norte |
| Interiores | Casa, gimnasios, Centro Pokémon, Tienda |

### Transiciones entre mapas

Al llegar al borde de un mapa o entrar a un edificio, el juego realiza una transición con **efecto iris** (círculo que se cierra y abre) al estilo Game Boy Color.

El juego recuerda la posición del jugador en el exterior cuando entra a un interior, y al salir lo devuelve exactamente al mismo punto.

### Mapas interiores

Los interiores (casas, gimnasios) usan el componente `InteriorMap`, que también es canvas-based. El jugador se mueve igual que en el exterior. Los pisos adicionales se conectan mediante escaleras.

---

## 9. Elementos multijugador

### Amigos en el mapa

Los jugadores pueden añadirse como amigos. Los amigos que estén conectados al mismo tiempo aparecen como sprites en el mapa, moviéndose en tiempo real (sincronización cada 4 segundos).

### Sistema de amigos

- Enviar solicitud de amistad (por nombre de usuario)
- Aceptar / rechazar solicitudes
- Ver a los amigos en el mapa del mundo

---

## 10. Panel de administración

El panel de administración permite configurar el juego sin tocar código:

### Qué se puede configurar

- **Gimnasios** — Activar / desactivar, cambiar nombre, orden, horario (mañana/día/noche)
- **Hábitos** — Añadir, editar o desactivar hábitos de cada gimnasio
- **Pokémon de gym** — Qué Pokémon y de qué nivel aparece en cada gimnasio
- **Presets** — Guardar configuraciones completas de hábitos para reutilizar

### Acceso

Solo los usuarios con rol de administrador pueden acceder a `/admin`. Los cambios se guardan en la base de datos y surten efecto inmediatamente.

---

## 11. Arquitectura técnica resumida

### Frontend

- **React + Vite** — SPA con rutas manejadas por estado
- **Canvas 2D** — Renderizado de mapas y batallas con `requestAnimationFrame`
- **Tiles 32×32 px** — Gráficos RMXP (RPG Maker XP) adaptados
- **Fuente** — Press Start 2P (Google Fonts)

### Backend

- **PHP** con API REST (`hb_api/index.php`)
- **MySQL** — Base de datos relacional
- **Autenticación** — Bearer token almacenado en `localStorage`

### Base de datos (tablas principales)

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Cuentas, avatar, monedas, inventario |
| `habitos` | Registro diario de hábitos por usuario y fecha |
| `habitos_template` | Configuración maestra de hábitos |
| `gimnasios_template` | Configuración de gimnasios |
| `pokemon_coleccion` | Pokémon capturados por cada usuario |
| `pokemon_template` | Pokémon de cada gimnasio |
| `progreso_diario` | Medallas conseguidas cada día |
| `amigos` | Relaciones de amistad entre usuarios |
| `usuario_posicion` | Posición actual en el mapa (MMO) |

### Flujo de datos por sesión

```
Login → token → GameContext (React Context global)
     ↓
Hábitos del día (GET /habitos/hoy)
     ↓
Completar hábito (POST /habitos/completar) → XP + monedas
     ↓
Entrar a gimnasio → BattleScreen
     ↓
Victoria (POST /gimnasios/completar) → medalla + Pokémon + monedas
     ↓
Siguiente día → reset automático al consultar /habitos/hoy
```

---

## Ciclo de juego diario

```
1. Entra al juego
2. Consulta tus hábitos pendientes del día
3. Realiza los hábitos en la vida real
4. Márcalos como completados en el juego
5. Entra al gimnasio correspondiente
6. Lucha contra el líder y gana la medalla
7. Tu Pokémon sube de nivel
8. Al día siguiente, el ciclo se reinicia
```

El objetivo final es completar todos los gimnasios disponibles manteniendo una racha de días consecutivos con hábitos completados.
