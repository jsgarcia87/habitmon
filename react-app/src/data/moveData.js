/**
 * moveData.js
 * Expanded move definitions for Essentials-style logic.
 */

export const MOVE_DATA = {
  'TACKLE': { 
    id: 'TACKLE', 
    nombre: 'PLACAJE', 
    power: 40, 
    accuracy: 100, 
    type: 'NORMAL', 
    category: 'physical', 
    priority: 0 
  },
  'GROWL': { 
    id: 'GROWL', 
    nombre: 'GRUÑIDO', 
    power: 0, 
    accuracy: 100, 
    type: 'NORMAL', 
    category: 'status', 
    priority: 0 
  },
  'SCRATCH': { 
    id: 'SCRATCH', 
    nombre: 'ARAÑAZO', 
    power: 40, 
    accuracy: 100, 
    type: 'NORMAL', 
    category: 'physical', 
    priority: 0 
  },
  'EMBER': { 
    id: 'EMBER', 
    nombre: 'ASCUAS', 
    power: 40, 
    accuracy: 100, 
    type: 'FIRE', 
    category: 'special', 
    priority: 0 
  },
  'WATER_GUN': { 
    id: 'WATER_GUN', 
    nombre: 'PISTOLA AGUA', 
    power: 40, 
    accuracy: 100, 
    type: 'WATER', 
    category: 'special', 
    priority: 0 
  },
  'VINE_WHIP': { 
    id: 'VINE_WHIP', 
    nombre: 'LÁTIGO CEPA', 
    power: 45, 
    accuracy: 100, 
    type: 'GRASS', 
    category: 'physical', 
    priority: 0 
  },
  'QUICK_ATTACK': { 
    id: 'QUICK_ATTACK', 
    nombre: 'ATAQUE RÁPIDO', 
    power: 40, 
    accuracy: 100, 
    type: 'NORMAL', 
    category: 'physical', 
    priority: 1 
  },
  'THUNDER_SHOCK': { 
    id: 'THUNDER_SHOCK', 
    nombre: 'IMPACTRUENO', 
    power: 40, 
    accuracy: 100, 
    type: 'ELECTRIC', 
    category: 'special', 
    priority: 0 
  },
  'CONFUSION': { 
    id: 'CONFUSION', 
    nombre: 'CONFUSIÓN', 
    power: 50, 
    accuracy: 100, 
    type: 'PSYCHIC', 
    category: 'special', 
    priority: 0 
  },
  'THUNDER_WAVE': { 
    id: 'THUNDER_WAVE', 
    nombre: 'ONDA TRUENO', 
    power: 0, 
    accuracy: 90, 
    type: 'ELECTRIC', 
    category: 'status', 
    priority: 0 
  },
  'LEER': { 
    id: 'LEER', 
    nombre: 'MALICIOSO', 
    power: 0, 
    accuracy: 100, 
    type: 'NORMAL', 
    category: 'status', 
    priority: 0 
  }
};

export const POKEMON_MOVES = {
  1:   ['TACKLE', 'GROWL'],     // Bulbasaur (Placeholder)
  4:   ['SCRATCH', 'GROWL'],    // Charmander
  7:   ['TACKLE', 'WATER_GUN'], // Squirtle
  25:  ['THUNDER_SHOCK', 'QUICK_ATTACK', 'THUNDER_WAVE'], // Pikachu
  152: ['TACKLE', 'GROWL', 'VINE_WHIP'], // Chikorita
  155: ['TACKLE', 'LEER', 'EMBER'],       // Cyndaquil
  158: ['SCRATCH', 'LEER', 'WATER_GUN'],  // Totodile
  151: ['CONFUSION', 'THUNDER_WAVE'],     // Mew (Gym Leader dummy)
  52:  ['SCRATCH', 'GROWL'],    // Meowth
  88:  ['TACKLE', 'LEER'],       // Grimer
  143: ['TACKLE', 'GROWL'],     // Snorlax
  56:  ['SCRATCH', 'LEER'],      // Mankey
  6:   ['EMBER', 'SCRATCH', 'GROWL'], // Charizard
  100: ['THUNDER_SHOCK', 'LEER'], // Voltorb
  63:  ['CONFUSION']            // Abra
};
