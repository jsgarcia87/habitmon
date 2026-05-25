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
  // ID 17 = suelo rosa con patrón de diamante, ID 24/28 = suelo rosa liso
  // ID 26 = tapete naranja de salida, IDs 0-15 = mostrador/maquinaria (sólido)
  // IDs 32,35,40,41,42,43,48,49,51 = paredes azules laterales/inferiores
  pokemon_center: {
    [17]: { walkable: true },  // suelo rosa con patrón diamante (principal)
    [24]: { walkable: true },  // suelo rosa variante
    [28]: { walkable: true },  // suelo rosa liso
    [26]: { walkable: true, type: 'exit' },  // tapete naranja salida
  },
  // ---- Tienda Pokémon (gsc pkmn mart.png — 8 cols × 7 rows = IDs 0-55) ----
  // ID 37 = suelo beige puro, ID 38 = suelo beige variante
  // ID 34 = tapete rojo de salida, IDs 0-15 = mostrador/estanterías (sólido)
  pokemon_shop: {
    [37]: { walkable: true },  // suelo beige (principal)
    [38]: { walkable: true },  // suelo beige variante
    [34]: { walkable: true, type: 'exit' },  // tapete rojo salida
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
//    gsc pkmn center.png  8×7 = 56 tiles
//      ID 17 = suelo rosa diamante  ID 26 = tapete naranja salida
//      IDs 0-7 = pared trasera/maquinaria  IDs 8-15 = mostrador
//      IDs 32,40,41,42,48 = paredes azules laterales
//    gsc pkmn mart.png  8×7 = 56 tiles
//      ID 37 = suelo beige  ID 34 = tapete rojo salida
//      IDs 0-7 = pared trasera/estanterías  IDs 8-15 = mostrador
// ==========================================

export function generatePokemonCenter() {
  const map = createMap(20, 15);
  // Sala compacta: x=5-14 (10 tiles), y=2-12 (11 filas)
  const X0 = 5, X1 = 14;
  const FLOOR = 17;   // suelo rosa con patrón de diamante
  const WALL_L = 40;  // pared lateral izq (azul+beige)
  const WALL_R = 35;  // pared lateral der (beige+gris)
  const EXIT = 26;    // tapete naranja salida

  // Fila 2: pared trasera superior (maquinaria — IDs 0-7 del tileset)
  const topRow = [0, 1, 2, 3, 4, 5, 6, 7];
  topRow.forEach((tile, i) => draw(map, 'base', X0 + i + 1, 2, tile));
  draw(map, 'base', X0, 2, 0);  draw(map, 'base', X1, 2, 7);

  // Fila 3: mostrador (IDs 8-15 del tileset)
  const counterRow = [8, 9, 9, 9, 11, 12, 9, 9];
  counterRow.forEach((tile, i) => draw(map, 'base', X0 + i + 1, 3, tile));
  draw(map, 'base', X0, 3, 8);  draw(map, 'base', X1, 3, 14);

  // Suelo rosa (filas 4-11)
  for (let y = 4; y <= 11; y++) {
    for (let x = X0; x <= X1; x++) draw(map, 'base', x, y, FLOOR);
  }

  // Paredes laterales
  for (let y = 4; y <= 11; y++) {
    draw(map, 'base', X0, y, WALL_L);
    draw(map, 'base', X1, y, WALL_R);
  }

  // Fila 12: suelo + tapete de salida centrado
  for (let x = X0; x <= X1; x++) draw(map, 'base', x, 12, FLOOR);
  draw(map, 'base', 9,  12, EXIT);
  draw(map, 'base', 10, 12, EXIT);

  return map;
}

export function generatePokemonShop() {
  const map = createMap(20, 15);
  // Sala compacta: x=5-14 (10 tiles), y=2-12 (11 filas)
  const X0 = 5, X1 = 14;
  const FLOOR = 37;   // suelo beige liso
  const WALL = 4;     // pared oscura lateral
  const SHELF_T = 6;  // estantería superior (verde)
  const SHELF_B = 8;  // estantería inferior (marrón/madera)
  const EXIT = 34;    // tapete rojo salida

  // Fila 2: pared trasera (IDs 0-7 del mart)
  const topRow = [0, 1, 2, 3, 4, 5, 6, 7];
  topRow.forEach((tile, i) => draw(map, 'base', X0 + i + 1, 2, tile));
  draw(map, 'base', X0, 2, 0);  draw(map, 'base', X1, 2, 7);

  // Fila 3: mostrador (IDs 8-15 del mart)
  const counterRow = [8, 9, 10, 11, 12, 13, 14, 15];
  counterRow.forEach((tile, i) => draw(map, 'base', X0 + i + 1, 3, tile));
  draw(map, 'base', X0, 3, 8);  draw(map, 'base', X1, 3, 14);

  // Suelo beige (filas 4-11)
  for (let y = 4; y <= 11; y++) {
    for (let x = X0; x <= X1; x++) draw(map, 'base', x, y, FLOOR);
  }

  // Estanterías laterales izq (x=5-6) y der (x=13-14)
  for (let y = 5; y <= 10; y++) {
    draw(map, 'base', X0,     y, SHELF_T);
    draw(map, 'base', X0 + 1, y, SHELF_B);
    draw(map, 'base', X1 - 1, y, SHELF_T);
    draw(map, 'base', X1,     y, SHELF_B);
  }

  // Paredes laterales (solo donde no hay estantería)
  for (let y = 4; y <= 11; y++) {
    if (y < 5 || y > 10) {
      draw(map, 'base', X0, y, WALL);
      draw(map, 'base', X1, y, WALL);
    }
  }

  // Fila 12: suelo + tapete de salida centrado
  for (let x = X0; x <= X1; x++) draw(map, 'base', x, 12, FLOOR);
  draw(map, 'base', 9,  12, EXIT);
  draw(map, 'base', 10, 12, EXIT);

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
    spawn: { x: 9, y: 9 },
    tiles: { floor: 17, exit: 26 }
  },
  'pokemon_shop': {
    tileset: `${BASE}Graphics/tilesets/gsc pkmn mart.png`,
    nombre: 'TIENDA POKÉMON',
    spawn: { x: 9, y: 9 },
    tiles: { floor: 37, exit: 34 }
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