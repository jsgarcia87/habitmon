/**
 * pokemonData.js
 * Expanded with Essentials-style base stats and types.
 */

export const POKEMON_SPECIES = {
  '016': { name: 'Pidgey', types: ['NORMAL', 'FLYING'], baseStats: { hp: 40, atk: 45, def: 40, spa: 35, spd: 35, spe: 56 } },
  '019': { name: 'Rattata', types: ['NORMAL'], baseStats: { hp: 30, atk: 56, def: 35, spa: 25, spd: 35, spe: 72 } },
  '021': { name: 'Spearow', types: ['NORMAL', 'FLYING'], baseStats: { hp: 40, atk: 60, def: 30, spa: 31, spd: 31, spe: 70 } },
  '025': { name: 'Pikachu', types: ['ELECTRIC'], baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } },
  '052': { name: 'Meowth', types: ['NORMAL'], baseStats: { hp: 40, atk: 45, def: 35, spa: 40, spd: 40, spe: 90 } },
  '053': { name: 'Persian', types: ['NORMAL'], baseStats: { hp: 65, atk: 70, def: 60, spa: 65, spd: 65, spe: 115 } },
  '066': { name: 'Machop', types: ['FIGHTING'], baseStats: { hp: 70, atk: 80, def: 50, spa: 35, spd: 35, spe: 35 } },
  '067': { name: 'Machoke', types: ['FIGHTING'], baseStats: { hp: 80, atk: 100, def: 70, spa: 50, spd: 60, spe: 45 } },
  '088': { name: 'Grimer', types: ['POISON'], baseStats: { hp: 80, atk: 80, def: 50, spa: 40, spd: 50, spe: 25 } },
  '143': { name: 'Snorlax', types: ['NORMAL'], baseStats: { hp: 160, atk: 110, def: 65, spa: 65, spd: 110, spe: 30 } },
  '056': { name: 'Mankey', types: ['FIGHTING'], baseStats: { hp: 40, atk: 80, def: 35, spa: 35, spd: 45, spe: 70 } },
  '006': { name: 'Charizard', types: ['FIRE', 'FLYING'], baseStats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 } },
  '100': { name: 'Voltorb', types: ['ELECTRIC'], baseStats: { hp: 40, atk: 30, def: 50, spa: 55, spd: 55, spe: 100 } },
  '063': { name: 'Abra', types: ['PSYCHIC'], baseStats: { hp: 25, atk: 20, def: 15, spa: 105, spd: 55, spe: 90 } },
  '152': { name: 'Chikorita', types: ['GRASS'], baseStats: { hp: 45, atk: 49, def: 65, spa: 49, spd: 65, spe: 45 } },
  '155': { name: 'Cyndaquil', types: ['FIRE'], baseStats: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 } },
  '158': { name: 'Totodile', types: ['WATER'], baseStats: { hp: 50, atk: 65, def: 64, spa: 44, spd: 48, spe: 43 } }
};

export const GYM_LEADER_POKEMON = {
  'vestirse': [
    { id: '052', level: 5, name: 'Quitar Ropa' },
    { id: '053', level: 8, name: 'Poner Ropa' }
  ],
  'gimnasio': [
    { id: '066', level: 10, name: 'Machop' },
    { id: '067', level: 15, name: 'Machoke' }
  ],
  'higiene': { id: '088', level: 8 },
  'desayuno': { id: '143', level: 12 },
  'comida': { id: '056', level: 15 },
  'cena': { id: '006', level: 20 },
  'orden': { id: '100', level: 10 },
  'estudio': { id: '063', level: 10 }
};

/**
 * Creates a battle-ready Pokémon instance from species data.
 */
export const createBattlePokemon = (speciesId, levelInput, customName = null) => {
  const level = Number(levelInput) || 1;
  const species = POKEMON_SPECIES[String(speciesId).padStart(3, '0')] || POKEMON_SPECIES['016'];
  const base = species.baseStats;

  // Simple but faithful stat formula - ensuring Number types
  const maxHp = Math.floor((Number(base.hp) * level / 25) + level + 10);
  const atk = Math.floor((Number(base.atk) * level / 50) + 5);
  const def = Math.floor((Number(base.def) * level / 50) + 5);
  const spa = Math.floor((Number(base.spa) * level / 50) + 5);
  const spd = Math.floor((Number(base.spd) * level / 50) + 5);
  const spe = Math.floor((Number(base.spe) * level / 50) + 5);

  return {
    id: speciesId,
    name: customName || species.name,
    level: level,
    hp: maxHp,
    maxHp: maxHp,
    attack: atk,
    defense: def,
    spAtk: spa,
    spDef: spd,
    speed: spe,
    types: species.types,
    status: null,
    statStages: { 
      attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, 
      accuracy: 0, evasion: 0 
    },
    moves: [] // Moves to be added based on POKEMON_MOVES data
  };
};

export const getPokemonByGym = (gymId) => {
  const data = GYM_LEADER_POKEMON[gymId];
  if (Array.isArray(data)) {
    return data.map(d => createBattlePokemon(d.id, d.level, d.name));
  }
  const single = data || { id: '016', level: 5 };
  return createBattlePokemon(single.id, single.level, single.name);
};
