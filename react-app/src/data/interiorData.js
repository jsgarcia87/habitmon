import { GYM_CONFIGS, GYM_MAPS, GYM_TILE_PROPERTIES } from './gymData';

const BASE = import.meta.env.BASE_URL || '/';

// ==========================================
// 1. CONFIGURACIÓN MAESTRA DE TILES (IDs GSC 1:1)
// ==========================================

const PB = {
  EMPTY: -1,
  FLOOR: 19,
  FLOOR_SHADOW: 21,
  WALL_TOP: 0, WALL_TOP_S: 5,
  WALL_FRONT: 8, WALL_FRONT_S: 13,
  STAIRS_UP_T: 7, STAIRS_UP_B: 15, 
  EXIT: 20, 
  TV: 26,
  TABLE_TL: 24, TABLE_TR: 25, 
  TABLE_BL: 32, TABLE_BR: 33,
  LEG_L: 17, LEG_R: 18,
  FRIDGE: 22, STOVE: 21, SINK: 20, WINDOW: 2
};

const P1 = {
  EMPTY: -1,
  FLOOR: 19,
  WALL_TOP: 0,
  WALL_FRONT: 13,
  PC_T: 1, PC_B: 9,
  STAIRS_L_T: 7, STAIRS_L_B: 15,
  STAIRS_R_T: 27, STAIRS_R_B: 35,
  BED_T: 40, BED_B: 48,
  SHELF_T: 8, SHELF_B: 16,
  EXIT: 41
};

// ==========================================
// 2. SISTEMA DE PROPIEDADES (Colisiones y Tipos)
// ==========================================
export const TILE_PROPERTIES = {
  house_1: { // PLANTA BAJA
    [19]: { walkable: true }, // Suelo
    [20]: { walkable: true, type: 'exit' }, // Alfombra salida principal (según matriz usuario)
    [41]: { walkable: true, type: 'exit' }, // Alfombra salida alternativo
    // Escaleras
    [34]: { walkable: true, type: 'stair', target: 'house_2' },
    [7]: { walkable: false }, [15]: { walkable: false }, // Parte estática escalera
    // Sólidos
    [2]: { walkable: false }, [3]: { walkable: false }, [22]: { walkable: false }, [26]: { walkable: false },
    [27]: { walkable: false }, [23]: { walkable: false }, [13]: { walkable: false }, [14]: { walkable: false },
    [32]: { walkable: false }, [33]: { walkable: false }, [17]: { walkable: false }, [18]: { walkable: false },
    [0]: { walkable: false }, [8]: { walkable: false }
  },
  house_2: { // PLANTA ALTA (HABITACIÓN) - Usando gsc_house_1.png
    [19]: { walkable: true }, // Suelo
    [41]: { walkable: true }, // Alfombra/Rug
    // Escaleras (Bajada)
    [7]: { walkable: true, type: 'stair', target: 'house_1' },
    [15]: { walkable: true, type: 'stair', target: 'house_1' },
    // Sólidos
    [1]: { walkable: false }, [9]: { walkable: false }, // PC
    [0]: { walkable: false }, [13]: { walkable: false }, [14]: { walkable: false }, // Paredes
    [27]: { walkable: false }, [35]: { walkable: false }, // Lado escalera
    [40]: { walkable: false }, [48]: { walkable: false }, // Cama
    [8]: { walkable: false }, [16]: { walkable: false }, // Estantería
    [17]: { walkable: false }, [18]: { walkable: false }  // Patas/Mesa
  },
  house_pokemon: { // Casa del Sr. Pokémon
    [19]: { walkable: true },
    [20]: { walkable: true, type: 'exit' },
    [0]: { walkable: false }, [8]: { walkable: false }, [13]: { walkable: false }, [14]: { walkable: false },
    [22]: { walkable: false }, [26]: { walkable: false }, [32]: { walkable: false }, [33]: { walkable: false }
  },
  // ---- Centro Pokémon (gsc pkmn center.png) — IDs verificados por extracción ----
  //   0  + 1   heal machine TOP  (panel verde + counter top con Pokéballs visibles)
  //   8  + 9   heal machine BOT  (counter front con 2 Pokéballs rosas, lado L y R)
  //   2        PC TOP            (cabina azul vertical)
  //  10        PC BOT             (monitor con franja diagonal)
  //   3        pared cornisa     (rayas horizontales = decoración alta)
  //  11        mostrador TOP     (rojo con diamantes — vista cenital del mostrador)
  //  24        mostrador FRONT   (mitad superior rojo + mitad inferior rosa floor)
  //  26        mostrador FRONT solid (rojo plano, esquinas)
  //   6, 7     estantería TOP    (con items: cajas, dispenser)
  //  15        estantería MID    (con baldas y artículos)
  //   5, 13, 14  corners y decoración de pared
  //  19        display PC (icono amarillo)
  //  50        display de pastel/sandwich (vending decorativo)
  //  28        SUELO ROSA con diamantes (el icónico floor del PC) ★
  pokemon_center: {
    // Suelo caminable
    [28]: { walkable: true },
    // Heal machine (interactuable como objeto decorativo) — 4 tiles 2×2
    [0]: { walkable: false, type: 'heal_machine' },
    [1]: { walkable: false, type: 'heal_machine' },
    [8]: { walkable: false, type: 'heal_machine' },
    [9]: { walkable: false, type: 'heal_machine' },
    // PC del entrenador — 2 tiles verticales
    [2]:  { walkable: false, type: 'pc' },
    [10]: { walkable: false, type: 'pc' },
    // Mostrador, paredes y resto — non-walkable por default
  },
  // ---- Tienda Pokémon (gsc pkmn mart.png) — IDs verificados ----
  //   0     estantería TOP con cajas
  //   2     estantería TOP con etiquetas
  //   5     estantería TOP con pokéball
  //   3     mostrador TOP (rojo con curva)
  //   4     pared trasera con barras verticales (display)
  //   8     estantería MID con items
  //  11/14  mostrador FRONT (rojo con banda amarilla)
  //  22     estantería con baldas
  //  12     SUELO crema (con bordes laterales — uniforme cream)
  //  29     wall→floor transition
  //  37/38  esquinas de pared cream
  pokemon_shop: {
    // El atlas del Mart no tiene un tile cream plano puro. Solución:
    // el suelo se pinta como color de fondo sólido sobre el canvas (via
    // backgroundColor en INTERIOR_CONFIGS) y las casillas de suelo se
    // marcan con -1 (sin tile), dejando ver el cream uniforme detrás.
    [-1]: { walkable: true },
    // Estanterías (decorativas)
    [0]:  { walkable: false, type: 'shelf' },
    [2]:  { walkable: false, type: 'shelf' },
    [5]:  { walkable: false, type: 'shelf' },
    [8]:  { walkable: false, type: 'shelf' },
    [22]: { walkable: false, type: 'shelf' },
  },
  ...GYM_TILE_PROPERTIES
};

// ==========================================
// 3. MOTOR DE GENERACIÓN
// ==========================================
function createMap(w, h) {
    const m = () => Array.from({ length: h }, () => Array(w).fill(-1));
    return { width: w, height: h, layers: { base: m(), deco: m(), overlay: m() } };
}

function draw(map, layer, x, y, tile) {
  if (map.layers[layer]?.[y]?.[x] !== undefined) map.layers[layer][y][x] = tile;
}

export function generateHouse1() {
  const map = createMap(20, 15);
  const startX = 6; 
  const startY = 2;

  // Matriz exacta respetando la distribución y el ID 14 en la fila 4
  const matrix = [
    [7, 27, 3, 0, 2, 0, 0, 34, 19],
    [15, 35, 26, 22, 19, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 23, 13, 14, 23, 19, 19, 19],
    [19, 19, 23, 32, 33, 23, 19, 19, 19],
    [19, 19, 19, 17, 18, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 20, 20, 19, 19, 19, 19, 19]
  ];

  matrix.forEach((row, y) => {
    row.forEach((tile, x) => {
      draw(map, 'base', startX + x, startY + y, tile);
    });
  });

  return map;
}

export function generateHouse2() {
  const map = createMap(20, 15);
  const startX = 6;
  const startY = 2;

  // Matriz exacta respetando la distribución original
  const matrix = [
    [1, 0, 0, 0, 7, 27, 0, 41, 19],
    [9, 19, 13, 14, 15, 35, 19, 19, 19],
    [19, 19, 17, 18, 19, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 19, 40, 19, 19, 19, 19, 19],
    [19, 19, 19, 48, 19, 19, 19, 19, 19],
    [8, 19, 19, 19, 19, 19, 19, 19, 19],
    [16, 19, 19, 19, 19, 19, 19, 19, 19]
  ];

  matrix.forEach((row, y) => {
    row.forEach((tile, x) => {
      draw(map, 'base', startX + x, startY + y, tile);
    });
  });

  return map;
}

// ==========================================
// 4. INTERIORES POKÉMON CENTER Y TIENDA
//    Tilesets: gsc pkmn center.png / gsc pkmn mart.png
//    Ambos: 256×224px → 8 cols × 7 rows = 56 tiles (IDs 0-55)
//    Cols: 0=wall,1=wall,2=wall,3=window,4=window,5=heal,6=pc,7=wall
//    Rows: 0-1=techo,2=mostrador,3=interior-mostrador,4-5=suelo,6=suelo+salida
// ==========================================

export function generatePokemonCenter() {
  const map = createMap(20, 15);
  // Interior 10×8 al estilo Crystal Cherrygrove PC. El mostrador es UNA
  // sola fila (no hay separación counter top + counter front); Joy y demás
  // se dibujan sobre el tile del mostrador y el jugador habla con ellos
  // desde la fila de suelo inmediatamente debajo — lo mismo que en Crystal.

  const W     = 3;   // pared cornisa (rayas horizontales) — encima del mostrador
  const HM_TL = 0;   // heal machine top-left
  const HM_TR = 1;   // heal machine top-right
  const HM_BL = 8;   // heal machine bottom-left (Pokéballs)
  const HM_BR = 9;   // heal machine bottom-right
  const PC_T  = 2;   // PC top
  const PC_B  = 10;  // PC monitor
  const CT    = 11;  // mostrador (rojo diamantes)
  const SHL   = 6;   // estantería items izq
  const SHR   = 7;   // estantería items der
  const F     = 28;  // suelo rosa con diamantes ★

  const OX = 5, OY = 3;

  // Layout 10 cols × 8 rows:
  //   row 0 (y=3): pared cornisa
  //   row 1 (y=4): items detrás del mostrador (heal machine top + PC top + shelves)
  //   row 2 (y=5): MOSTRADOR (Joy y otros NPCs aquí — interactúa el jugador desde y=6)
  //   row 3..6 (y=6..9): suelo rosa
  //   row 7 (y=10): suelo (2 casillas centrales son la salida)
  const layout = [
    [W,    W,     W,     W,    W,    W,    W,    W,    W,     W   ],
    [SHL,  SHR,   HM_TL, HM_TR,W,    W,    W,    PC_T, SHL,   SHR ],
    [CT,   CT,    HM_BL, HM_BR,CT,   CT,   CT,   PC_B, CT,    CT  ],
    [F,    F,     F,     F,    F,    F,    F,    F,    F,     F   ],
    [F,    F,     F,     F,    F,    F,    F,    F,    F,     F   ],
    [F,    F,     F,     F,    F,    F,    F,    F,    F,     F   ],
    [F,    F,     F,     F,    F,    F,    F,    F,    F,     F   ],
    [F,    F,     F,     F,    F,    F,    F,    F,    F,     F   ],
  ];

  layout.forEach((row, dy) => {
    row.forEach((tile, dx) => {
      draw(map, 'base', OX + dx, OY + dy, tile);
    });
  });

  return map;
}

export function generatePokemonShop() {
  const map = createMap(20, 15);
  // Tienda estilo Cherrygrove Mart: una sola fila de mostrador donde está el
  // dependiente (no full-width). El resto del muro superior son estanterías
  // con items. Suelo cream uniforme renderizado con backgroundColor.

  const SH_BOX = 0;   // estantería con cajas (top)
  const SH_LBL = 2;   // estantería con etiquetas (top)
  const SH_PB  = 5;   // estantería con pokéball (top)
  const SH_M   = 8;   // estantería MID con items
  const SH_M2  = 22;  // estantería MID con baldas
  const CT     = 3;   // mostrador (rojo)
  const F      = -1;  // suelo transparente (cream sólido del canvas detrás)

  const OX = 5, OY = 3;

  // Layout 10×8:
  //   row 0 (y=3): estanterías top
  //   row 1 (y=4): MOSTRADOR (1 tile en el centro) + resto estantería mid
  //                el clerk se dibuja sobre el CT y el jugador habla desde y=5
  //   row 2..6 (y=5..9): suelo cream uniforme
  //   row 7 (y=10): suelo (cols 4-5 son la salida invisible)
  const layout = [
    [SH_BOX, SH_LBL, SH_PB,  SH_BOX, SH_LBL, SH_PB,  SH_BOX, SH_LBL, SH_PB,  SH_BOX],
    [SH_M,   SH_M2,  SH_M,   SH_M2,  CT,     SH_M2,  SH_M2,  SH_M,   SH_M2,  SH_M  ],
    [F,      F,      F,      F,      F,      F,      F,      F,      F,      F     ],
    [F,      F,      F,      F,      F,      F,      F,      F,      F,      F     ],
    [F,      F,      F,      F,      F,      F,      F,      F,      F,      F     ],
    [F,      F,      F,      F,      F,      F,      F,      F,      F,      F     ],
    [F,      F,      F,      F,      F,      F,      F,      F,      F,      F     ],
    [F,      F,      F,      F,      F,      F,      F,      F,      F,      F     ],
  ];

  layout.forEach((row, dy) => {
    row.forEach((tile, dx) => {
      draw(map, 'base', OX + dx, OY + dy, tile);
    });
  });

  return map;
}

// ==========================================
// 5. EXPORTS
// ==========================================

export const INTERIOR_CONFIGS = {
  'house_1': { 
    tileset: `${BASE}Graphics/tilesets/gsc house 1.png`,
    nombre: 'HOGAR - PB',
    spawn: { x: 9, y: 9 }, 
    tiles: { floor: 19, exit: 20, stair: 34 }
  },
  'house_2': { 
    tileset: `${BASE}Graphics/tilesets/gsc house 1.png`,
    nombre: 'HOGAR - HABITACIÓN',
    spawn: { x: 10, y: 4 }, 
    tiles: { floor: 19, stair: 15 }
  },
  'house_pokemon': {
    tileset: `${BASE}Graphics/tilesets/gsc house 1.png`,
    nombre: 'CASA SR. POKÉMON',
    spawn: { x: 9, y: 9 },
    tiles: { floor: 19, exit: 20 }
  },
  'pokemon_center': {
    tileset: `${BASE}Graphics/tilesets/gsc pkmn center.png`,
    nombre: 'CENTRO POKÉMON',
    // Interior 10×8 con offset (5, 3) → ocupa cols 5-14, filas 3-10.
    // Mostrador en y=5 (Joy aquí); suelo desde y=6. Salida en (9,10)/(10,10).
    spawn: { x: 9, y: 9 },
    exitPositions: [{ x: 9, y: 10 }, { x: 10, y: 10 }],
    tiles: { floor: 28 }
  },
  'pokemon_shop': {
    tileset: `${BASE}Graphics/tilesets/gsc pkmn mart.png`,
    nombre: 'TIENDA POKÉMON',
    // Interior 10×8 con offset (5, 3). Mostrador en y=4 (clerk aquí);
    // suelo desde y=5. Salida en (9,10)/(10,10).
    spawn: { x: 9, y: 9 },
    exitPositions: [{ x: 9, y: 10 }, { x: 10, y: 10 }],
    backgroundColor: '#F0E0D0',
    tiles: { floor: -1 }
  },
  ...GYM_CONFIGS
};

export const INTERIOR_MAPS = {
  house_1: generateHouse1(),
  house_2: generateHouse2(),
  house_pokemon: generateHouse1(),
  pokemon_center: generatePokemonCenter(),
  pokemon_shop: generatePokemonShop(),
  ...GYM_MAPS
};