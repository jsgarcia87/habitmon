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
  // ---- Centro Pokémon (gsc pkmn center.png — 8 cols × 7 rows = IDs 0-55) ----
  pokemon_center: {
    // Floor tiles (walkable)
    [36]: { walkable: true },
    [37]: { walkable: true },
    [44]: { walkable: true },
    [45]: { walkable: true },
    [52]: { walkable: true },
    [53]: { walkable: true },
    // Exit mat
    [54]: { walkable: true, type: 'exit' },
    [55]: { walkable: true, type: 'exit' },
    // All others are walls / counter / furniture → non-walkable (default)
  },
  // ---- Tienda Pokémon (gsc pkmn mart.png — 8 cols × 7 rows = IDs 0-55) ----
  pokemon_shop: {
    // Floor tiles (walkable)
    [36]: { walkable: true },
    [37]: { walkable: true },
    [44]: { walkable: true },
    [45]: { walkable: true },
    [52]: { walkable: true },
    [53]: { walkable: true },
    // Exit mat
    [54]: { walkable: true, type: 'exit' },
    [55]: { walkable: true, type: 'exit' },
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
  // Centro Pokémon Crystal-style:
  // Fila 2: pared superior (tile 0)
  // Fila 3: mostrador superior (tiles 8-15 dependiendo del col)
  // Fila 4: mostrador inferior / área detrás (Joy en col 9)
  // Filas 5-12: suelo libre
  // Fila 13: suelo
  // Fila 14: suelo + alfombra salida en centro

  // Pared superior
  for (let x = 2; x <= 17; x++) draw(map, 'base', x, 2, 0);
  draw(map, 'base', 2, 2, 0); draw(map, 'base', 17, 2, 0);

  // Mostrador / zona Joy (Joy queda en y=3 del lado de atrás)
  // Tiles: 8=counter-left, 9=counter-mid, 10=counter-right, 11=heal-machine, 12=pc
  for (let x = 3; x <= 16; x++) draw(map, 'base', x, 3, 9);
  draw(map, 'base', 3, 3, 8);  // esquina izq mostrador
  draw(map, 'base', 16, 3, 10); // esquina der mostrador
  draw(map, 'base', 5, 3, 11);  // máquina curación izq
  draw(map, 'base', 6, 3, 11);
  draw(map, 'base', 13, 3, 12); // PC derecha
  draw(map, 'base', 14, 3, 12);

  // Frente del mostrador (primera fila caminable)
  for (let x = 3; x <= 16; x++) draw(map, 'base', x, 4, 36);

  // Suelo principal
  for (let y = 4; y <= 13; y++) {
    for (let x = 2; x <= 17; x++) draw(map, 'base', x, y, 36);
  }

  // Variante de suelo para patrón visual
  for (let y = 5; y <= 12; y += 2) {
    for (let x = 3; x <= 16; x += 2) draw(map, 'base', x, y, 37);
  }

  // Sillas / bancos laterales
  for (let y = 10; y <= 11; y++) {
    draw(map, 'base', 4, y, 44); draw(map, 'base', 5, y, 44);
    draw(map, 'base', 14, y, 44); draw(map, 'base', 15, y, 44);
  }

  // Paredes laterales
  for (let y = 2; y <= 13; y++) {
    draw(map, 'base', 2, y, 0);
    draw(map, 'base', 17, y, 0);
  }

  // Fila inferior con salida
  for (let x = 2; x <= 17; x++) draw(map, 'base', x, 14, 36);
  draw(map, 'base', 8, 14, 54);  // alfombra salida
  draw(map, 'base', 9, 14, 55);

  return map;
}

export function generatePokemonShop() {
  const map = createMap(20, 15);
  // Tienda Crystal-style:
  // Fila 2: pared superior
  // Fila 3: mostrador del dependiente
  // Fila 4: zona mostrador
  // Filas 5-13: suelo con estanterías en los laterales
  // Fila 14: salida

  // Pared superior
  for (let x = 2; x <= 17; x++) draw(map, 'base', x, 2, 0);

  // Mostrador
  for (let x = 3; x <= 16; x++) draw(map, 'base', x, 3, 9);
  draw(map, 'base', 3, 3, 8);
  draw(map, 'base', 16, 3, 10);

  // Frente mostrador
  for (let x = 3; x <= 16; x++) draw(map, 'base', x, 4, 36);

  // Suelo principal
  for (let y = 4; y <= 13; y++) {
    for (let x = 2; x <= 17; x++) draw(map, 'base', x, y, 36);
  }

  // Estanterías laterales (izq y der)
  for (let y = 5; y <= 12; y++) {
    draw(map, 'base', 4, y, 44); draw(map, 'base', 5, y, 44); // estantería izq
    draw(map, 'base', 14, y, 44); draw(map, 'base', 15, y, 44); // estantería der
  }

  // Paredes laterales
  for (let y = 2; y <= 13; y++) {
    draw(map, 'base', 2, y, 0);
    draw(map, 'base', 17, y, 0);
  }

  // Fila inferior con salida
  for (let x = 2; x <= 17; x++) draw(map, 'base', x, 14, 36);
  draw(map, 'base', 8, 14, 54);
  draw(map, 'base', 9, 14, 55);

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
    spawn: { x: 9, y: 10 },
    tiles: { floor: 36, exit: 54 }
  },
  'pokemon_shop': {
    tileset: `${BASE}Graphics/tilesets/gsc pkmn mart.png`,
    nombre: 'TIENDA POKÉMON',
    spawn: { x: 9, y: 10 },
    tiles: { floor: 36, exit: 54 }
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