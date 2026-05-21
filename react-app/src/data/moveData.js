/**
 * moveData.js
 * Move definitions inspired by Pokémon Crystal (Gen 2).
 *
 * Each move can have:
 *   effect       – string key handled by moveEffects.js
 *   effectChance – 0–100, probability of secondary effect triggering
 *   recoil       – fraction of damage dealt taken back (RECOIL effect)
 *   critBoost    – true → 4× higher crit chance (high-crit moves)
 */

export const MOVE_DATA = {

  // ── Moves físicos básicos ──────────────────────────────────────────────────
  'TACKLE':       { id: 'TACKLE',       nombre: 'PLACAJE',        power: 40,  accuracy: 100, type: 'NORMAL',   category: 'physical', priority: 0 },
  'SCRATCH':      { id: 'SCRATCH',      nombre: 'ARAÑAZO',        power: 40,  accuracy: 100, type: 'NORMAL',   category: 'physical', priority: 0 },
  'PECK':         { id: 'PECK',         nombre: 'PICOTAZO',       power: 35,  accuracy: 100, type: 'FLYING',   category: 'physical', priority: 0 },
  'QUICK_ATTACK': { id: 'QUICK_ATTACK', nombre: 'ATAQUE RÁPIDO',  power: 40,  accuracy: 100, type: 'NORMAL',   category: 'physical', priority: 1 },
  'VINE_WHIP':    { id: 'VINE_WHIP',    nombre: 'LÁTIGO CEPA',    power: 45,  accuracy: 100, type: 'GRASS',    category: 'physical', priority: 0 },
  'WING_ATTACK':  { id: 'WING_ATTACK',  nombre: 'ATAQUE ALA',     power: 60,  accuracy: 100, type: 'FLYING',   category: 'physical', priority: 0 },
  'GUST':         { id: 'GUST',         nombre: 'TORNADO',        power: 40,  accuracy: 100, type: 'FLYING',   category: 'special',  priority: 0 },
  'SLASH':        { id: 'SLASH',        nombre: 'TAJO',           power: 70,  accuracy: 100, type: 'NORMAL',   category: 'physical', priority: 0, critBoost: true },
  'BITE':         { id: 'BITE',         nombre: 'MORDISCO',       power: 60,  accuracy: 100, type: 'DARK',     category: 'physical', priority: 0 },
  'EARTHQUAKE':   { id: 'EARTHQUAKE',   nombre: 'TERREMOTO',      power: 100, accuracy: 100, type: 'GROUND',   category: 'physical', priority: 0 },
  'ROCK_SLIDE':   { id: 'ROCK_SLIDE',   nombre: 'AVALANCHA',      power: 75,  accuracy: 90,  type: 'ROCK',     category: 'physical', priority: 0 },
  'DOUBLE_KICK':  { id: 'DOUBLE_KICK',  nombre: 'DOBLE PATADA',   power: 30,  accuracy: 100, type: 'FIGHTING', category: 'physical', priority: 0, effect: 'DOUBLE_HIT' },
  'FURY_SWIPES':  { id: 'FURY_SWIPES',  nombre: 'ARAÑAZO MULT.',  power: 18,  accuracy: 80,  type: 'NORMAL',   category: 'physical', priority: 0, effect: 'MULTI_HIT' },

  // Con retroceso
  'TAKE_DOWN':    { id: 'TAKE_DOWN',    nombre: 'DERRIBO',        power: 90,  accuracy: 85,  type: 'NORMAL',   category: 'physical', priority: 0, effect: 'RECOIL', recoil: 0.25 },
  'DOUBLE_EDGE':  { id: 'DOUBLE_EDGE',  nombre: 'DOBLE FILO',     power: 120, accuracy: 100, type: 'NORMAL',   category: 'physical', priority: 0, effect: 'RECOIL', recoil: 0.33 },

  // Con efecto secundario de estado
  'BODY_SLAM':    { id: 'BODY_SLAM',    nombre: 'GOLPE CUERPO',   power: 85,  accuracy: 100, type: 'NORMAL',   category: 'physical', priority: 0, effect: 'PARALYZE_HIT', effectChance: 30 },

  // ── Moves especiales ──────────────────────────────────────────────────────
  'EMBER':           { id: 'EMBER',           nombre: 'ASCUAS',        power: 40,  accuracy: 100, type: 'FIRE',     category: 'special', priority: 0, effect: 'BURN_HIT',     effectChance: 10 },
  'FLAMETHROWER':    { id: 'FLAMETHROWER',    nombre: 'LANZALLAMAS',   power: 95,  accuracy: 100, type: 'FIRE',     category: 'special', priority: 0, effect: 'BURN_HIT',     effectChance: 10 },
  'FIRE_BLAST':      { id: 'FIRE_BLAST',      nombre: 'DEFLAGRACIÓN',  power: 120, accuracy: 85,  type: 'FIRE',     category: 'special', priority: 0, effect: 'BURN_HIT',     effectChance: 10 },
  'WATER_GUN':       { id: 'WATER_GUN',       nombre: 'PISTOLA AGUA',  power: 40,  accuracy: 100, type: 'WATER',    category: 'special', priority: 0 },
  'SURF':            { id: 'SURF',            nombre: 'SURF',          power: 95,  accuracy: 100, type: 'WATER',    category: 'special', priority: 0 },
  'THUNDER_SHOCK':   { id: 'THUNDER_SHOCK',   nombre: 'IMPACTRUENO',   power: 40,  accuracy: 100, type: 'ELECTRIC', category: 'special', priority: 0, effect: 'PARALYZE_HIT', effectChance: 10 },
  'THUNDERBOLT':     { id: 'THUNDERBOLT',     nombre: 'RAYO',          power: 95,  accuracy: 100, type: 'ELECTRIC', category: 'special', priority: 0, effect: 'PARALYZE_HIT', effectChance: 10 },
  'THUNDER':         { id: 'THUNDER',         nombre: 'TRUENO',        power: 120, accuracy: 70,  type: 'ELECTRIC', category: 'special', priority: 0, effect: 'PARALYZE_HIT', effectChance: 30 },
  'ICE_BEAM':        { id: 'ICE_BEAM',        nombre: 'RAYO HIELO',    power: 95,  accuracy: 100, type: 'ICE',      category: 'special', priority: 0, effect: 'FREEZE_HIT',   effectChance: 10 },
  'BLIZZARD':        { id: 'BLIZZARD',        nombre: 'VENTISCA',      power: 120, accuracy: 70,  type: 'ICE',      category: 'special', priority: 0, effect: 'FREEZE_HIT',   effectChance: 10 },
  'CONFUSION':       { id: 'CONFUSION',       nombre: 'CONFUSIÓN',     power: 50,  accuracy: 100, type: 'PSYCHIC',  category: 'special', priority: 0, effect: 'CONFUSE_HIT',  effectChance: 10 },
  'PSYCHIC_ATK':     { id: 'PSYCHIC_ATK',     nombre: 'PSÍQUICO',      power: 90,  accuracy: 100, type: 'PSYCHIC',  category: 'special', priority: 0, effect: 'LOWER_SPDEF_HIT', effectChance: 10 },
  'SHADOW_BALL':     { id: 'SHADOW_BALL',     nombre: 'BOLA SOMBRA',   power: 80,  accuracy: 100, type: 'GHOST',    category: 'special', priority: 0, effect: 'LOWER_SPDEF_HIT', effectChance: 20 },
  'SLUDGE_BOMB':     { id: 'SLUDGE_BOMB',     nombre: 'BOMBA LODO',    power: 90,  accuracy: 100, type: 'POISON',   category: 'special', priority: 0, effect: 'POISON_HIT',   effectChance: 30 },

  // ── Moves de estado: infliger condición ──────────────────────────────────
  'GROWL':          { id: 'GROWL',          nombre: 'GRUÑIDO',        power: 0, accuracy: 100, type: 'NORMAL',   category: 'status', priority: 0, effect: 'LOWER_ATK' },
  'LEER':           { id: 'LEER',           nombre: 'MALICIOSO',      power: 0, accuracy: 100, type: 'NORMAL',   category: 'status', priority: 0, effect: 'LOWER_DEF' },
  'TAIL_WHIP':      { id: 'TAIL_WHIP',      nombre: 'LÁTIGO',         power: 0, accuracy: 100, type: 'NORMAL',   category: 'status', priority: 0, effect: 'LOWER_DEF' },
  'SAND_ATTACK':    { id: 'SAND_ATTACK',    nombre: 'ATAQUE ARENA',   power: 0, accuracy: 100, type: 'GROUND',   category: 'status', priority: 0, effect: 'LOWER_ACC' },
  'SMOKESCREEN':    { id: 'SMOKESCREEN',    nombre: 'HUMO',           power: 0, accuracy: 100, type: 'NORMAL',   category: 'status', priority: 0, effect: 'LOWER_ACC' },
  'STRING_SHOT':    { id: 'STRING_SHOT',    nombre: 'TELARAÑA',       power: 0, accuracy: 95,  type: 'BUG',      category: 'status', priority: 0, effect: 'LOWER_SPD' },
  'SCARY_FACE':     { id: 'SCARY_FACE',     nombre: 'CARA SUSTO',     power: 0, accuracy: 90,  type: 'NORMAL',   category: 'status', priority: 0, effect: 'LOWER_SPD_2' },
  'THUNDER_WAVE':   { id: 'THUNDER_WAVE',   nombre: 'ONDA TRUENO',    power: 0, accuracy: 90,  type: 'ELECTRIC', category: 'status', priority: 0, effect: 'APPLY_PARALYZE' },
  'POISON_POWDER':  { id: 'POISON_POWDER',  nombre: 'POLVO VENENO',   power: 0, accuracy: 75,  type: 'POISON',   category: 'status', priority: 0, effect: 'APPLY_POISON' },
  'TOXIC':          { id: 'TOXIC',          nombre: 'TÓXICO',         power: 0, accuracy: 85,  type: 'POISON',   category: 'status', priority: 0, effect: 'APPLY_TOXIC' },
  'SLEEP_POWDER':   { id: 'SLEEP_POWDER',   nombre: 'SOMNÍFERA',      power: 0, accuracy: 75,  type: 'GRASS',    category: 'status', priority: 0, effect: 'APPLY_SLEEP' },
  'CONFUSE_RAY':    { id: 'CONFUSE_RAY',    nombre: 'RAYO CONFUSO',   power: 0, accuracy: 100, type: 'GHOST',    category: 'status', priority: 0, effect: 'APPLY_CONFUSE' },
  'SWEET_KISS':     { id: 'SWEET_KISS',     nombre: 'BESO DULCE',     power: 0, accuracy: 75,  type: 'NORMAL',   category: 'status', priority: 0, effect: 'APPLY_CONFUSE' },
  'LEECH_SEED':     { id: 'LEECH_SEED',     nombre: 'LÁTEX',          power: 0, accuracy: 90,  type: 'GRASS',    category: 'status', priority: 0, effect: 'LEECH_SEED' },

  // ── Moves de estado: subir estadísticas propias ───────────────────────────
  'MEDITATE':       { id: 'MEDITATE',       nombre: 'MEDITACIÓN',     power: 0, accuracy: 100, type: 'PSYCHIC',  category: 'status', priority: 0, effect: 'RAISE_ATK' },
  'SWORDS_DANCE':   { id: 'SWORDS_DANCE',   nombre: 'DANZA ESPADA',   power: 0, accuracy: 100, type: 'NORMAL',   category: 'status', priority: 0, effect: 'RAISE_ATK_2' },
  'NASTY_PLOT':     { id: 'NASTY_PLOT',     nombre: 'MAQUINACIÓN',    power: 0, accuracy: 100, type: 'DARK',     category: 'status', priority: 0, effect: 'RAISE_SPATK_2' },
  'AGILITY':        { id: 'AGILITY',        nombre: 'AGILIDAD',       power: 0, accuracy: 100, type: 'PSYCHIC',  category: 'status', priority: 0, effect: 'RAISE_SPD_2' },
  'CALM_MIND':      { id: 'CALM_MIND',      nombre: 'MENTE SERENA',   power: 0, accuracy: 100, type: 'PSYCHIC',  category: 'status', priority: 0, effect: 'RAISE_SPATK_SPDEF' },

  // ── Moves de estado: curación / barreras ──────────────────────────────────
  'RECOVER':        { id: 'RECOVER',        nombre: 'RECUPERACIÓN',   power: 0, accuracy: 100, type: 'NORMAL',   category: 'status', priority: 0, effect: 'HEALING' },
  'SOFT_BOILED':    { id: 'SOFT_BOILED',    nombre: 'HUEVO BLANDO',   power: 0, accuracy: 100, type: 'NORMAL',   category: 'status', priority: 0, effect: 'HEALING' },
  'REFLECT':        { id: 'REFLECT',        nombre: 'REFLEJO',        power: 0, accuracy: 100, type: 'PSYCHIC',  category: 'status', priority: 0, effect: 'SET_REFLECT' },
  'LIGHT_SCREEN':   { id: 'LIGHT_SCREEN',   nombre: 'BARRERA LUZ',    power: 0, accuracy: 100, type: 'PSYCHIC',  category: 'status', priority: 0, effect: 'SET_LIGHT_SCREEN' },

  // ── Moves de clima ────────────────────────────────────────────────────────
  'RAIN_DANCE':     { id: 'RAIN_DANCE',     nombre: 'DANZA LLUVIA',   power: 0, accuracy: 100, type: 'WATER',    category: 'status', priority: 0, effect: 'SET_RAIN' },
  'SUNNY_DAY':      { id: 'SUNNY_DAY',      nombre: 'SOLACIÓN',       power: 0, accuracy: 100, type: 'FIRE',     category: 'status', priority: 0, effect: 'SET_SUN' },
  'SANDSTORM':      { id: 'SANDSTORM',      nombre: 'TORM. ARENA',    power: 0, accuracy: 100, type: 'ROCK',     category: 'status', priority: 0, effect: 'SET_SANDSTORM' },
};

// ── Movesets por especie (ID numérico) ────────────────────────────────────────
export const POKEMON_MOVES = {
  1:   ['TACKLE', 'GROWL', 'VINE_WHIP', 'SLEEP_POWDER'],              // Bulbasaur
  4:   ['SCRATCH', 'GROWL', 'EMBER', 'SMOKESCREEN'],                  // Charmander
  7:   ['TACKLE', 'TAIL_WHIP', 'WATER_GUN', 'BITE'],                 // Squirtle
  6:   ['SCRATCH', 'GROWL', 'FLAMETHROWER', 'SCARY_FACE'],           // Charizard
  16:  ['TACKLE', 'SAND_ATTACK', 'GUST', 'WING_ATTACK'],             // Pidgey
  19:  ['TACKLE', 'TAIL_WHIP', 'QUICK_ATTACK', 'SCARY_FACE'],        // Rattata
  21:  ['PECK', 'LEER', 'QUICK_ATTACK', 'WING_ATTACK'],              // Spearow
  25:  ['THUNDER_SHOCK', 'QUICK_ATTACK', 'THUNDER_WAVE', 'THUNDERBOLT'], // Pikachu
  52:  ['SCRATCH', 'GROWL', 'BITE', 'FURY_SWIPES'],                  // Meowth
  53:  ['SCRATCH', 'LEER', 'BITE', 'SLASH'],                         // Persian
  56:  ['SCRATCH', 'LEER', 'DOUBLE_KICK', 'SCARY_FACE'],             // Mankey
  63:  ['CONFUSION', 'THUNDER_WAVE', 'RECOVER', 'PSYCHIC_ATK'],      // Abra
  66:  ['TACKLE', 'LEER', 'DOUBLE_KICK', 'SCARY_FACE'],              // Machop
  67:  ['TACKLE', 'LEER', 'DOUBLE_KICK', 'ROCK_SLIDE'],              // Machoke
  88:  ['TACKLE', 'POISON_POWDER', 'SLUDGE_BOMB', 'TOXIC'],          // Grimer
  100: ['THUNDER_SHOCK', 'LEER', 'THUNDERBOLT', 'THUNDER_WAVE'],     // Voltorb
  143: ['TACKLE', 'GROWL', 'BODY_SLAM', 'LEER'],                     // Snorlax
  151: ['CONFUSION', 'THUNDER_WAVE', 'RECOVER', 'PSYCHIC_ATK'],      // Mew
  152: ['TACKLE', 'GROWL', 'VINE_WHIP', 'REFLECT'],                  // Chikorita
  155: ['TACKLE', 'LEER', 'EMBER', 'SMOKESCREEN'],                   // Cyndaquil
  158: ['SCRATCH', 'LEER', 'WATER_GUN', 'BITE'],                     // Totodile
};
