---
name: project-pokedex-duo
description: Implementación e ingeniería inversa de la Pokédex Duo en Habitmon
metadata:
  type: project
---

# Proyecto Pokédex Duo — Ingeniería Inversa e Integración

Inspirado en el concepto de hardware plegable interactivo *Pokédex Duo* de WithAnimation.app (por Shubham Singh).

## Objetivos Alcanzados

1. **Investigación e Ingeniería Inversa:**
   - Análisis de la estructura de doble pantalla (dispositivo plegable / dual-screen) y emulación en web (React 19 + Canvas 2D + CSS 3D).
   - Replicación sin dependencias externas pesadas ni SwiftUI privativo.

2. **Nuevo dataset enciclopédico (`react-app/src/data/pokedexData.js`):**
   - Descripciones de Pokédex completas en español (lore fiel a Gen 1 / Gen 2).
   - Categorías de especies ("Pokémon Semilla", "Pokémon Ratón", etc.).
   - Alturas, pesos y paleta de colores oficiales por tipo de Pokémon.
   - Función auxiliar `getPokedexData(speciesId)`.

3. **Estilos de hardware retro (`react-app/src/components/PokedexDuo.css`):**
   - Chasis rojo de policarbonato con biseles en relieve.
   - Gran lente azul retro con animación de pulso y LEDs indicadores (rojo, amarillo, verde).
   - Bisagra central cilíndrica con gradiente metálico.
   - Pantalla LCD verde-cian con scanlines sutiles y animación flotante de sprites (`image-rendering: pixelated`).
   - Vista de tapa cerrada abatible con relieve de Pokéball y mensaje de apertura.
   - Adaptabilidad responsive (horizontal en escritorio, apilado en móvil).

4. **Componente interactivo (`react-app/src/screens/PokedexScreen.jsx`):**
   - **Keypad Numérico Funcional (3x4):** Botones 0-9, ⌫ y ↵ con sonido de tecla (`sfx.cursor`) y búsqueda directa por número de Pokédex con soporte para teclado físico.
   - **Voz Sintetizada de Pokédex (*Spoken Facts*):** Integración nativa con la Web Speech API (`window.speechSynthesis`) en español con voz retro/robótica y control de reproducción.
   - **D-Pad de Navegación:** Botones Anterior / Siguiente y filtrado entre "Todos los Pokémon" y "Mis Habitmon" (capturados por el usuario).
   - **Mini-pantalla secundaria:** Gráfico de barras para estadísticas base (PS, ATQ, DEF, VEL).
   - **Botón de Plegado / Cierre:** Permite cerrar y abrir la Pokédex con animación.
