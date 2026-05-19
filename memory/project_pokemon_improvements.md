---
name: project-pokemon-improvements
description: Mejoras al sistema de batalla para hacerlo más fiel a Pokémon clásico
metadata:
  type: project
---

Sesión de mejoras "más fiel a Pokémon clásico".

**Why:** El usuario quiere que la experiencia de batalla sea más auténtica al Gen 1/2.

**How to apply:** Referencia para continuar en sesiones futuras.

## Completado en esta sesión

### Typewriter + botón A en mensajes de batalla (BattleScreen.jsx)
- Cada mensaje de batalla aparece letra por letra (28ms/char)
- Al terminar de escribir aparece cursor parpadeante `▼` (CSS `blink`)
- Tap en el cuadro de mensaje O botón A (prop `aPressed`) avanza/salta la animación
- `showMessage(text)` → Promise que resuelve solo cuando el jugador presiona A
- `handleAdvance()` para tap en el cuadro de mensaje
- `enemyPkmnRef` para leer HP actualizado en callbacks async (evita stale closures)
- `handleHabitAttack` reescrito como async puro (eliminados los setTimeout anidados en setEnemyPkmn)

## Layouts de gimnasios mejorados (gymData.js)
- Cada gimnasio tiene su propio generador con obstáculos temáticos
- Vestirse: 3 filas de percheros (racks) a los lados
- Higiene: divisores de cabina de baño desde las paredes laterales
- Orden: cuadrícula regular de pilares de piedra (4 filas)
- Comida: mostrador de cocina angosto en y=4 (paso por x=9,10) + mesas de comedor
- Desayuno: mostrador largo con hueco central + taburetes de bar
- Fitness: bloques de equipamiento alternando derecha/izquierda (zigzag)
- Corredor central (x=9,10) siempre libre desde la entrada hasta el líder
- El líder NPC está hardcodeado en GymScreen.jsx a (9,2); leaderPos en GYM_CONFIGS no se usa

## Pendientes para futuras sesiones

- Menú de movimientos con Tipo en color + PP restantes/máximos
- Sistema de PP completo (moves infinitos actualmente)
- Barra de HP animada (tick por tick como Gen 1/2)
- Barra de EXP visible en el HUD del jugador
- Secuencia de nivel con stats uno a uno
