# Backup del Sistema de Combate - 30 de Abril 2026

Este directorio contiene una versión estable del motor de combate de Habitmon, optimizada para el sistema de gimnasios.

## Archivos Respaldados:
- `BattleScreen.jsx`: Lógica de daño proporcional y gestión de turnos.
- `HPBar.jsx`: Barra de vida con transiciones CSS fluidas.
- `pokemonData.js`: Generación de Pokémon con tipos numéricos seguros.

## Mejoras de esta Versión:
1. **Daño Lineal**: El daño se divide exactamente por el número de hábitos visibles.
2. **Robustez de la Barra**: Eliminados los parpadeos rojos al inicio.
3. **Seguridad de Datos**: Prevención de concatenación de strings en las estadísticas de HP.

Si necesitas restaurar esta versión, copia estos archivos de nuevo a sus carpetas correspondientes en `src/`.
