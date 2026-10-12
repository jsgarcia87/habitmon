# Instrucciones para Claude Code

> Consulta **[AGENT.md](AGENT.md)** como guía maestra del proyecto y protocolo de convivencia multi-IA.

## Reglas Clave para Sesiones de Claude
1. **Memoria Compartida (`memory/`):**
   - Antes de iniciar, consulta siempre `memory/MEMORY.md` y los archivos temáticos (ej. `memory/project_pokemon_improvements.md`) para conocer el estado actual y tareas pendientes.
   - Al completar o pausar una sesión, actualiza `memory/` registrando cambios completados y siguientes pasos.
2. **Referencias Normativas:**
   - Consulta `.claude/skills/habitmon/references/` para especificaciones canónicas de Pokémon Cristal (`pokecrystal-reference.md`), estética (`crystal-style.md`) y arquitectura (`habitmon-project.md`).
3. **Regla de Oro:**
   - Ampliar y mejorar sobre la base existente, sin sobreescribir ni rehacer código ya implementado por otros agentes.
   - Nunca edites directamente en `habitmon_release/` (generado por `./release.sh`).
