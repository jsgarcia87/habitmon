# Animaciones

Guía para crear las animaciones de Habitmon: las **animaciones de combate** de los
movimientos y la **animación de sprites**, con la estética de Pokémon Cristal. Antes
de usarla, lee `habitmon-project.md`: las animaciones se implementan en el motor de
canvas (React + Canvas 2D), no en un editor externo.

## Índice

1. Tipos de animación en Habitmon
2. Principios de animación pixel art
3. Animación de sprites en el mundo
4. Animación de Pokémon en combate
5. Animación de un movimiento (ataque)
6. Animaciones de sistema ya existentes
7. Cómo se implementan en el motor canvas
8. Lista de comprobación

---

## 1. Tipos de animación en Habitmon

- **Sprites del mundo:** personajes y NPCs caminando; objetos animados (agua,
  puertas).
- **Pokémon en combate:** la animación al aparecer y el pequeño "respiro" del sprite.
- **Animaciones de movimiento:** el efecto visual de cada ataque sobre el atacante,
  el objetivo o la pantalla.
- **Animaciones de sistema:** intro de batalla, barra de vida que baja, captura,
  evolución, transición de iris entre mapas.

## 2. Principios de animación pixel art

- **Pocos fotogramas, bien elegidos.** Gen 2 anima con 2–4 fotogramas por acción. La
  expresividad importa más que la fluidez.
- **Timing.** Cuánto dura cada fotograma define el carácter: un golpe es rápido y
  seco; un movimiento de estado puede ser más lento.
- **Anticipación, acción, reacción.** Incluso con pocos fotogramas, una acción se lee
  mejor con una pequeña preparación antes y una reacción después.
- **Coherencia de rejilla y paleta.** Los fotogramas comparten rejilla y paleta.
- **Legibilidad.** Para público infantil, que se entienda qué pasa: quién ataca, a
  quién, con qué efecto.

## 3. Animación de sprites en el mundo

- Un personaje del mundo tiene un conjunto de fotogramas de caminar para cada
  dirección.
- El ciclo de caminar alterna fotogramas mientras el personaje se mueve por la
  rejilla de 32 px; en reposo vuelve al fotograma neutro.
- Tiles animados (agua, faros) recorren en bucle unos pocos fotogramas.
- Mantén las spritesheets ordenadas y consistentes.

## 4. Animación de Pokémon en combate

- Cada especie tiene **sprite frontal y trasero**.
- Como sello de Cristal, el sprite del Pokémon hace una **breve animación al
  entrar** en combate y puede tener un balanceo sutil de "idle".
- Esa animación de aparición da vida a la criatura sin necesitar muchos fotogramas.

## 5. Animación de un movimiento (ataque)

La animación de un ataque encadena fases:

1. **Anticipación:** el atacante hace un gesto o se ilumina.
2. **Acción:** el efecto en sí — un proyectil que viaja, un destello, partículas —
   dirigido al objetivo o cubriendo la pantalla.
3. **Impacto:** el efecto golpea al objetivo; aquí se aplica el cálculo de daño.
4. **Reacción:** el objetivo se sacude o parpadea.

Define para cada animación: el **foco** (sobre el usuario, el objetivo o la pantalla
entera), la **secuencia de fotogramas** y su posición, el **timing** de cada paso y
el **sonido** de cada momento clave. El estilo del ataque debe encajar con el **tipo**
del movimiento (fuego y agua se ven y suenan distinto).

## 6. Animaciones de sistema ya existentes

Habitmon ya tiene varias animaciones; las nuevas deben encajar con su estilo:

- **Intro de batalla** (contra líder): VS Screen → entrada del entrenador → la
  Pokéball vuela en arco → el Pokémon aparece en silueta y se revela → las barras de
  HP entran en pantalla.
- **Evolución:** flash de entrada → 3 destellos de transformación → morph al nuevo
  sprite → fanfare de celebración.
- **Transición entre mapas:** efecto iris (un círculo que se cierra y se abre).

Reutiliza estos patrones y su ritmo cuando crees animaciones nuevas.

## 7. Cómo se implementan en el motor canvas

> Estándar de fidelidad: en Cristal una animación de combate es ella misma un
> **script de comandos** (`anim_wait`, `anim_obj`, `anim_sound`, cambios de paleta,
> objetos que son máquinas de estado...). Ver `pokecrystal-reference.md` §6. El motor
> de Habitmon debería interpretar un mini-script de animación por movimiento, no
> reproducir un gif fijo.

El runtime de Habitmon es React + Canvas 2D, así que una animación es una **máquina
de estados sobre fotogramas** dentro del bucle de juego:

- Recorta los fotogramas de una **spritesheet** (personaje, Pokémon, efecto).
- Avanza de fotograma según un **temporizador** que acumula el tiempo del bucle
  (`requestAnimationFrame`), no según fotogramas de pantalla, para que sea
  independiente del rendimiento.
- Modela el ataque como una secuencia de fases (anticipación → acción → impacto →
  reacción), cada una con su duración.
- Sincroniza los sonidos con los fotogramas clave; aplica el daño en el de impacto.
- Usa `image-rendering: pixelated` y escala con factor entero para conservar el look.

Esquema de un reproductor de animación por fotogramas:

```javascript
function avanzarAnimacion(anim, dt) {
  anim.t += dt;
  if (anim.t >= anim.duracionFotograma) {
    anim.t -= anim.duracionFotograma;
    anim.fotograma++;
    if (anim.fotograma >= anim.totalFotogramas) {
      anim.fotograma = anim.bucle ? 0 : anim.totalFotogramas - 1;
      anim.terminada = !anim.bucle;
    }
  }
}
```

Una animación de ataque encadena varias de estas fases en orden. Antes de
implementarla, **revisa cómo están hechas las animaciones existentes** del proyecto
(intro de batalla, evolución) y sigue ese mismo patrón.

## 8. Lista de comprobación

- ¿Usa pocos fotogramas, coherentes con el estilo Cristal?
- ¿Se lee con claridad quién actúa, sobre quién y con qué efecto?
- ¿El timing encaja con el carácter de la acción (golpe seco vs. efecto lento)?
- ¿El estilo del ataque encaja con el tipo del movimiento?
- ¿Los sonidos están sincronizados y el daño se aplica en el fotograma de impacto?
- ¿Sigue el patrón de las animaciones existentes del motor canvas?
- ¿Se escala con factor entero y mantiene la paleta?
