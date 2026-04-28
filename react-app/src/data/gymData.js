const BASE = import.meta.env.BASE_URL || '/';

export const GYM_CONFIGS = {
  'Map015': { // Gimnasio Vestirse
    id: 'vestirse',
    nombre: 'LÍDER DE VESTIMENTA',
    sprite: 'char_ 31_a',
    tileset: `${BASE}Graphics/tilesets/gsc gym 2b.png`,
    dialogo: ['¡Hogar, dulce hogar! Pero solo si está ordenado.', '¿Has recogido ya toda tu ropa hoy?'],
    tiles: { floor: 15, wall: 11, carpet: 37 },
    leaderPos: { x: 9, y: 5 }
  },
  'Map046': { // Gimnasio Higiene
    id: 'higiene',
    nombre: 'LÍDER DE HIGIENE',
    sprite: 'char_ 16_a',
    tileset: `${BASE}Graphics/tilesets/gsc gym 2a.png`,
    dialogo: ['¡La limpieza es salud!', '¿Te has lavado ya los dientes?'],
    tiles: { floor: 15, wall: 1, carpet: 37 },
    leaderPos: { x: 9, y: 5 }
  },
  'Map007': { // Gimnasio Orden
    id: 'orden',
    nombre: 'LÍDER DE ORDEN',
    sprite: 'char_ 34_a',
    tileset: `${BASE}Graphics/tilesets/gsc cave-gym d.png`,
    dialogo: ['¡El caos es mi enemigo!', '¿Has ordenado tu habitación hoy?'],
    tiles: { floor: 10, wall: 4, carpet: 26 },
    leaderPos: { x: 9, y: 5 }
  },
  'Map016': { // Gimnasio Comida
    id: 'comida',
    nombre: 'LÍDER DE COMIDA',
    sprite: 'char_ 24_a',
    tileset: `${BASE}Graphics/tilesets/gsc gym 1b.png`,
    dialogo: ['¡Eres lo que comes!', '¿Has comido ya algo saludable?'],
    tiles: { floor: 28, wall: 17, carpet: 21 },
    leaderPos: { x: 9, y: 5 }
  },
  'Map005': { // Gimnasio Desayuno
    id: 'desayuno',
    nombre: 'LÍDER DE DESAYUNO',
    sprite: 'char_ 09_a',
    tileset: `${BASE}Graphics/tilesets/gsc gym 1a.png`,
    dialogo: ['¡El desayuno es lo más importante!', '¿Has desayunado ya hoy?'],
    tiles: { floor: 28, wall: 17, carpet: 21 },
    leaderPos: { x: 9, y: 5 }
  },
  'Map008': { // Gimnasio Fitness
    id: 'gimnasio',
    nombre: 'LÍDER DE FITNESS',
    sprite: 'char_ 29_a',
    tileset: `${BASE}Graphics/tilesets/gsc cave-gym d.png`,
    dialogo: ['¡Sin dolor no hay gloria!', '¿Has hecho ya tu ejercicio hoy?'],
    tiles: { floor: 10, wall: 4, carpet: 26 },
    leaderPos: { x: 9, y: 5 }
  }
};

// Generar propiedades de tiles para cada gimnasio automáticamente
export const GYM_TILE_PROPERTIES = {};
Object.keys(GYM_CONFIGS).forEach(key => {
  const cfg = GYM_CONFIGS[key];
  GYM_TILE_PROPERTIES[key] = {
    [cfg.tiles.floor]: { walkable: true },
    [cfg.tiles.carpet]: { walkable: true, type: 'exit' },
    [cfg.tiles.wall]: { walkable: false }
  };
});

// Función para generar un mapa de gimnasio básico pero funcional
function generateGymMap(cfg) {
  const w = 20, h = 15;
  const layers = {
    base: Array.from({length: h}, () => Array(w).fill(-1)),
    deco: Array.from({length: h}, () => Array(w).fill(-1)),
    overlay: Array.from({length: h}, () => Array(w).fill(-1))
  };
  
  const startX = 5, startY = 2;
  const rw = 10, rh = 12;

  // Llenar suelo
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      layers.base[startY + y][startX + x] = cfg.tiles.floor;
    }
  }

  // Paredes (Base)
  for (let x = 0; x < rw; x++) layers.base[startY][startX + x] = cfg.tiles.wall;
  for (let y = 0; y < rh; y++) {
    layers.base[startY + y][startX] = cfg.tiles.wall;
    layers.base[startY + y][startX + rw - 1] = cfg.tiles.wall;
  }

  // Alfombra de salida (2 tiles en la parte inferior central)
  layers.base[startY + rh - 1][startX + 4] = cfg.tiles.carpet;
  layers.base[startY + rh - 1][startX + 5] = cfg.tiles.carpet;

  return { width: w, height: h, layers };
}

export const GYM_MAPS = {};
Object.keys(GYM_CONFIGS).forEach(key => {
  GYM_MAPS[key] = generateGymMap(GYM_CONFIGS[key]);
});

console.log("✅ GYM_MAPS loaded:", Object.keys(GYM_MAPS));
