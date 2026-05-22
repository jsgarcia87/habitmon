# Estética Pokémon Cristal (Gen 2)

Base visual común para todo el contenido de Habitmon. Pokémon Cristal salió para
Game Boy Color; sus límites técnicos definen el estilo. Imitarlo bien significa
**abrazar esas restricciones con intención**, no esconderlas.

## Índice

1. Rejilla y resolución
2. Color y paletas
3. Sprites y fotogramas
4. Tiles y bloques
5. Interfaz de usuario
6. El sello de Cristal frente a Oro/Plata
7. Reglas prácticas

---

## 1. Rejilla y resolución

- **Pantalla original:** 160 × 144 px.
- **Tile base:** 8 × 8 px. Casi todo el gráfico se compone de estos mosaicos.
- **Rejilla de movimiento:** el personaje ocupa y avanza en pasos de 16 × 16 px
  (dos tiles). El mundo se piensa y se diseña sobre esa rejilla.
- **Bloques de mapa:** los mapas se montan con bloques mayores —típicamente 32 × 32
  px (4 × 4 tiles)— que agrupan tiles reutilizables.

Si trabajas a mayor resolución, mantén la rejilla lógica y **escala con factor
entero** (x2, x3, x4) para conservar el pixel art nítido. En web/canvas usa
`image-rendering: pixelated`.

## 2. Color y paletas

El GBC no usa color libre, trabaja con paletas pequeñas:

- Cada tile usa una paleta de **4 colores** (uno suele ser transparente en sprites).
- El número de paletas simultáneas es limitado: agrupa elementos por paleta.
- El resultado son **colores planos y saturados**, sin degradados suaves. El volumen
  se sugiere con 2–3 tonos por superficie, no con sombreado realista.

Para Habitmon: define una paleta corta por zona o región. La limitación de color
ayuda a que cada lugar sea reconocible de un vistazo.

## 3. Sprites y fotogramas

- **Personajes del mundo (overworld):** sprites de 16 × 16 px, con pocos fotogramas
  de caminar por cada dirección.
- **Pokémon en combate:** sprites más grandes encajados en un marco fijo; en Gen 2
  tienen una breve animación al aparecer. Cada especie tiene sprite frontal y
  trasero.
- **Animación limitada:** 2–4 fotogramas por acción. El encanto está en lo expresivo
  de pocos fotogramas, no en la fluidez.
- **Legibilidad:** siluetas claras, contraste con el fondo, detalle mínimo pero
  reconocible.

## 4. Tiles y bloques

- Los mapas son rejillas de bloques reutilizables: hierba, camino, agua, edificios,
  interiores.
- Cada tile lleva información de **pasabilidad** y a veces de comportamiento (hierba
  alta, agua, escaleras, ledges/saltos).
- Estética: naturaleza estilizada, pueblos acogedores, interiores cálidos.

## 5. Interfaz de usuario

Señas de identidad de la UI de Gen 2:

- **Cuadros de texto** con borde definido, fuente de mapa de bits monoespaciada,
  texto que aparece carácter a carácter.
- **Menús** de lista vertical con un cursor (una flechita) que se mueve.
- **HUD de combate** sobrio: nombre, nivel y barra de vida, sin recargar la pantalla.
- Sonidos cortos de confirmación/cancelación y "bleeps" de texto.

## 6. El sello de Cristal frente a Oro/Plata

Pokémon Cristal mantiene la base de Oro/Plata pero con una identidad algo más fría y
"cristalina", sprites de Pokémon **animados** al entrar en combate, y la región de
Johto con su mezcla de tradición y naturaleza. Gen 2 también introdujo el **reloj en
tiempo real** con mañana/día/noche, que tinta los mapas y cambia el mundo: un recurso
estético potente que conviene aprovechar.

## 7. Reglas prácticas

- Diseña sobre la rejilla de 8/16/32 px; no pongas nada "a ojo" fuera de ella.
- Paletas cortas por zona; colores planos, sin degradados.
- Pocos fotogramas, bien elegidos, antes que animación fluida.
- Escala siempre con factor entero.
- Mantén HUD y menús sobrios y legibles.
- Tono cálido y acogedor: encaja con Cristal y con un público infantil.
