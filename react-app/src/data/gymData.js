const BASE = import.meta.env.BASE_URL || '/';

export const GYM_CONFIGS = {
  'Map015': { // Gimnasio Vestirse
    id: 'vestirse',
    nombre: 'LÍDER DE VESTIMENTA',
    sprite: 'char_ 31_a',
    battle_sprite: 'trainer020', // sprite de batalla (uniforme)
    tileset: `${BASE}Graphics/tilesets/gsc gym 2b.png`,
    dialogo: ['¡Hogar, dulce hogar! Pero solo si está ordenado.', '¿Has recogido ya toda tu ropa hoy?'],
    tiles: { floor: 15, wall: 11, carpet: 37 },
    leaderPos: { x: 9, y: 3 }
  },
  'Map046': { // Gimnasio Higiene
    id: 'higiene',
    nombre: 'LÍDER DE HIGIENE',
    sprite: 'char_ 16_a',
    battle_sprite: 'trainer010', // CLAIR (líder dragón canónico)
    tileset: `${BASE}Graphics/tilesets/gsc gym 2a.png`,
    dialogo: ['¡La limpieza es salud!', '¿Te has lavado ya los dientes?'],
    tiles: { floor: 15, wall: 1, carpet: 37 },
    leaderPos: { x: 9, y: 3 }
  },
  'Map007': { // Gimnasio Orden
    id: 'orden',
    nombre: 'LÍDER DE ORDEN',
    sprite: 'char_ 34_a',
    battle_sprite: 'trainer040', // figura determinada
    tileset: `${BASE}Graphics/tilesets/gsc cave-gym d.png`,
    dialogo: ['¡El caos es mi enemigo!', '¿Has ordenado tu habitación hoy?'],
    tiles: { floor: 10, wall: 4, carpet: 26 },
    leaderPos: { x: 9, y: 3 }
  },
  'Map016': { // Gimnasio Comida
    id: 'comida',
    nombre: 'LÍDER DE COMIDA',
    sprite: 'char_ 24_a',
    battle_sprite: 'trainer060', // cocinero
    tileset: `${BASE}Graphics/tilesets/gsc gym 1b.png`,
    dialogo: ['¡Eres lo que comes!', '¿Has comido ya algo saludable?'],
    tiles: { floor: 28, wall: 17, carpet: 21 },
    leaderPos: { x: 9, y: 3 }
  },
  'Map005': { // Gimnasio Desayuno
    id: 'desayuno',
    nombre: 'LÍDER DE DESAYUNO',
    sprite: 'char_ 09_a',
    battle_sprite: 'trainer050', // entrenadora amable
    tileset: `${BASE}Graphics/tilesets/gsc gym 1a.png`,
    dialogo: ['¡El desayuno es lo más importante!', '¿Has desayunado ya hoy?'],
    tiles: { floor: 28, wall: 17, carpet: 21 },
    leaderPos: { x: 9, y: 3 }
  },
  'Map008': { // Gimnasio Fitness
    id: 'fitness',
    nombre: 'LÍDER DE FITNESS',
    sprite: 'char_ 29_a',
    battle_sprite: 'trainer055', // luchador
    tileset: `${BASE}Graphics/tilesets/gsc cave-gym d.png`,
    dialogo: ['¡Sin dolor no hay gloria!', '¿Has hecho ya tu ejercicio hoy?'],
    tiles: { floor: 10, wall: 4, carpet: 26 },
    leaderPos: { x: 9, y: 3 }
  },
  'pokecenter': {
    id: null,
    type: 'pokecenter',
    nombre: 'CENTRO POKÉMON',
    sprite: 'char_ 11_a',
    tileset: `${BASE}Graphics/tilesets/gsc gym 1a.png`,
    dialogo: ['¡Hola! Bienvenido al Centro Pokémon.', '¿Quieres que restauremos las fuerzas de tus Habitmon?'],
    tiles: { floor: 28, wall: 17, carpet: 21 },
    leaderPos: { x: 9, y: 3 }
  },
  'mart': {
    id: null,
    type: 'mart',
    nombre: 'TIENDA POKÉMON',
    sprite: 'char_ 02_a',
    tileset: `${BASE}Graphics/tilesets/gsc gym 2b.png`,
    dialogo: ['¡Hola! Bienvenido a la Tienda Pokémon.', '¿En qué te puedo ayudar hoy?'],
    tiles: { floor: 15, wall: 11, carpet: 37 },
    leaderPos: { x: 9, y: 3 }
  }
};

export const GYM_TILE_PROPERTIES = {};
Object.keys(GYM_CONFIGS).forEach(key => {
  const cfg = GYM_CONFIGS[key];
  GYM_TILE_PROPERTIES[key] = {
    [cfg.tiles.floor]: { walkable: true },
    [cfg.tiles.carpet]: { walkable: true, type: 'exit' },
    [cfg.tiles.wall]: { walkable: false }
  };
});

// Room constants: 10 wide × 12 tall, origin at (5, 2)
const X0 = 5, Y0 = 2, RW = 10, RH = 12;

function createBaseRoom(cfg) {
  const w = 20, h = 15;
  const layers = {
    base: Array.from({length: h}, () => Array(w).fill(-1)),
    deco: Array.from({length: h}, () => Array(w).fill(-1)),
    overlay: Array.from({length: h}, () => Array(w).fill(-1))
  };

  // Floor fill
  for (let y = Y0; y < Y0 + RH; y++)
    for (let x = X0; x < X0 + RW; x++)
      layers.base[y][x] = cfg.tiles.floor;

  // Top wall
  for (let x = X0; x < X0 + RW; x++) layers.base[Y0][x] = cfg.tiles.wall;

  // Left and right walls
  for (let y = Y0; y < Y0 + RH; y++) {
    layers.base[y][X0] = cfg.tiles.wall;
    layers.base[y][X0 + RW - 1] = cfg.tiles.wall;
  }

  // Entrance carpet (bottom center: x=9,10)
  layers.base[Y0 + RH - 1][X0 + 4] = cfg.tiles.carpet;
  layers.base[Y0 + RH - 1][X0 + 5] = cfg.tiles.carpet;

  return { w, h, layers };
}

function setWalls(layers, wall, coords) {
  for (const [x, y] of coords) layers.base[y][x] = wall;
}

// Vestirse: 3 rows of paired clothing racks on both sides
// Central corridor (x=9,10) always open for player
function generateVestirse(cfg) {
  const { w, h, layers } = createBaseRoom(cfg);
  setWalls(layers, cfg.tiles.wall, [
    [7,5],[8,5],  [11,5],[12,5],
    [7,7],[8,7],  [11,7],[12,7],
    [7,9],[8,9],  [11,9],[12,9]
  ]);
  return { width: w, height: h, layers };
}

// Higiene: bathroom stall dividers protruding inward from side walls
function generateHigiene(cfg) {
  const { w, h, layers } = createBaseRoom(cfg);
  setWalls(layers, cfg.tiles.wall, [
    [6,6],[13,6],
    [6,8],[13,8],
    [6,10],[13,10]
  ]);
  return { width: w, height: h, layers };
}

// Orden: organized grid of stone pillars (single tiles, perfectly spaced)
function generateOrden(cfg) {
  const { w, h, layers } = createBaseRoom(cfg);
  setWalls(layers, cfg.tiles.wall, [
    [7,5],[12,5],
    [7,7],[12,7],
    [7,9],[12,9],
    [7,11],[12,11]
  ]);
  return { width: w, height: h, layers };
}

// Comida: restaurant kitchen counter near top + dining tables below
// Counter flanks the narrow kitchen entrance (x=9,10 gap leads to chef)
function generateComida(cfg) {
  const { w, h, layers } = createBaseRoom(cfg);
  setWalls(layers, cfg.tiles.wall, [
    // Kitchen counter near top (gap at x=9,10 to reach leader)
    [6,4],[7,4],[8,4],  [11,4],[12,4],[13,4],
    // Dining tables
    [6,7],[7,7],        [12,7],[13,7],
    [6,10],[7,10],      [12,10],[13,10]
  ]);
  return { width: w, height: h, layers };
}

// Desayuno: long breakfast counter near top with gap + bar stools below
function generateDesayuno(cfg) {
  const { w, h, layers } = createBaseRoom(cfg);
  setWalls(layers, cfg.tiles.wall, [
    // Breakfast counter (gap at x=9,10 in center)
    [6,5],[7,5],[8,5],  [11,5],[12,5],[13,5],
    // Bar stools
    [7,8],[12,8],
    [7,10],[12,10]
  ]);
  return { width: w, height: h, layers };
}

// Fitness: exercise equipment alternating left/right to create zigzag course
function generateFitness(cfg) {
  const { w, h, layers } = createBaseRoom(cfg);
  setWalls(layers, cfg.tiles.wall, [
    // Right side equipment
    [11,5],[12,5],[13,5],
    // Left side equipment
    [6,7],[7,7],[8,7],
    // Right side
    [11,9],[12,9],[13,9],
    // Left side
    [6,11],[7,11],[8,11]
  ]);
  return { width: w, height: h, layers };
}

// Pokecenter: counter row near top (gap at x=9,10 to reach Joy), open floor for players
function generatePokecenter(cfg) {
  const { w, h, layers } = createBaseRoom(cfg);
  setWalls(layers, cfg.tiles.wall, [
    [6,4],[7,4],[8,4],[11,4],[12,4],[13,4]
  ]);
  return { width: w, height: h, layers };
}

// Mart: counter near top + shelving units on both sides
function generateMart(cfg) {
  const { w, h, layers } = createBaseRoom(cfg);
  setWalls(layers, cfg.tiles.wall, [
    [6,4],[7,4],[8,4],[11,4],[12,4],[13,4],
    [6,6],[6,8],[6,10],
    [13,6],[13,8],[13,10]
  ]);
  return { width: w, height: h, layers };
}

const GENERATORS = {
  'Map015': generateVestirse,
  'Map046': generateHigiene,
  'Map007': generateOrden,
  'Map016': generateComida,
  'Map005': generateDesayuno,
  'Map008': generateFitness,
  'pokecenter': generatePokecenter,
  'mart': generateMart,
};

export const GYM_MAPS = {};
Object.keys(GYM_CONFIGS).forEach(key => {
  const gen = GENERATORS[key] || ((cfg) => {
    const { w, h, layers } = createBaseRoom(cfg);
    return { width: w, height: h, layers };
  });
  GYM_MAPS[key] = gen(GYM_CONFIGS[key]);
});

console.log("✅ GYM_MAPS loaded:", Object.keys(GYM_MAPS));
