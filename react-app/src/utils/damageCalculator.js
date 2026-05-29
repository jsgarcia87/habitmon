/**
 * damageCalculator.js
 * Gen 2 (Crystal) faithful damage formula with weather and screen support.
 */

export const TYPE_CHART = {
  NORMAL:   { ROCK: 0.5,  GHOST: 0,    STEEL: 0.5 },
  FIRE:     { FIRE: 0.5,  WATER: 0.5,  GRASS: 2,    ICE: 2,      BUG: 2,      ROCK: 0.5,  DRAGON: 0.5, STEEL: 2 },
  WATER:    { FIRE: 2,    WATER: 0.5,  GRASS: 0.5,  GROUND: 2,   ROCK: 2,     DRAGON: 0.5 },
  GRASS:    { FIRE: 0.5,  WATER: 2,    GRASS: 0.5,  POISON: 0.5, GROUND: 2,   FLYING: 0.5, BUG: 0.5,   ROCK: 2,     DRAGON: 0.5, STEEL: 0.5 },
  ELECTRIC: { WATER: 2,   GRASS: 0.5,  ELECTRIC: 0.5, GROUND: 0, FLYING: 2,   DRAGON: 0.5 },
  ICE:      { FIRE: 0.5,  WATER: 0.5,  GRASS: 2,    ICE: 0.5,    GROUND: 2,   FLYING: 2,   DRAGON: 2,   STEEL: 0.5 },
  FIGHTING: { NORMAL: 2,  ICE: 2,      POISON: 0.5, FLYING: 0.5, PSYCHIC: 0.5, BUG: 0.5,  ROCK: 2,     GHOST: 0,    DARK: 0.5, STEEL: 2 },
  POISON:   { GRASS: 2,   POISON: 0.5, GROUND: 0.5, ROCK: 0.5,   GHOST: 0.5,  STEEL: 0 },
  GROUND:   { FIRE: 2,    ELECTRIC: 2, GRASS: 0.5,  POISON: 2,   FLYING: 0,   BUG: 0.5,   ROCK: 2,     STEEL: 2 },
  FLYING:   { GRASS: 2,   ELECTRIC: 0.5, FIGHTING: 2, BUG: 2,    ROCK: 0.5,   STEEL: 0.5 },
  PSYCHIC:  { FIGHTING: 2, POISON: 2,  PSYCHIC: 0.5, DARK: 0,    STEEL: 0.5 },
  BUG:      { FIRE: 0.5,  GRASS: 2,    FIGHTING: 0.5, POISON: 0.5, FLYING: 0.5, PSYCHIC: 2, GHOST: 0.5, DARK: 2,   STEEL: 0.5 },
  ROCK:     { FIRE: 2,    ICE: 2,      FIGHTING: 0.5, GROUND: 0.5, FLYING: 2,  BUG: 2,     STEEL: 0.5 },
  GHOST:    { NORMAL: 0,  PSYCHIC: 2,  GHOST: 2,    DARK: 0.5 },
  DRAGON:   { DRAGON: 2,  STEEL: 0.5 },
  DARK:     { FIGHTING: 0.5, PSYCHIC: 2, GHOST: 2,  DARK: 0.5,   STEEL: 0.5 },
  STEEL:    { FIRE: 0.5,  WATER: 0.5,  ELECTRIC: 0.5, ICE: 2,    ROCK: 2,     STEEL: 0.5 }
};

export const getEffectiveness = (attackType, targetTypes) => {
  let multiplier = 1;
  targetTypes.forEach(type => {
    const chart = TYPE_CHART[attackType];
    if (chart && chart[type] !== undefined) multiplier *= chart[type];
  });
  return multiplier;
};

const getStatWithStage = (baseValue, stage) => {
  if (stage === 0) return baseValue;
  const num = Math.max(2, 2 + stage);
  const den = Math.max(2, 2 - stage);
  return Math.floor(baseValue * (num / den));
};

/**
 * Main Damage Formula (Crystal / Gen 2 style).
 * battleState: { weather: {type, turns}, defenderScreens: {reflect, lightScreen} }
 */
export const calculateDamage = (attacker, defender, move, battleState = {}) => {
  const result = { finalDamage: 0, isCritical: false, effectiveness: 1 };

  if (move.category === 'status' || move.power === 0) return result;

  const level = attacker.level || 5;
  const power = move.power;

  const isSpecial = move.category === 'special';
  const attackStat  = isSpecial ? (attacker.spAtk  || attacker.attack)  : attacker.attack;
  const attackStage = isSpecial ? (attacker.statStages?.spAtk  || 0) : (attacker.statStages?.attack  || 0);
  const A = getStatWithStage(attackStat, attackStage);

  const defenseStat  = isSpecial ? (defender.spDef  || defender.defense) : defender.defense;
  const defenseStage = isSpecial ? (defender.statStages?.spDef  || 0) : (defender.statStages?.defense || 0);
  const D = getStatWithStage(defenseStat, defenseStage);

  let damage = (((2 * level / 5 + 2) * power * A / D) / 50) + 2;

  // Critical hit — high-crit moves (critBoost) have 8x the chance
  const critChance = move.critBoost ? 0.25 : 0.0625;
  if (Math.random() < critChance) {
    result.isCritical = true;
    damage *= 1.5;
  }

  // Random factor (0.85–1.0 range, Crystal-accurate)
  damage *= 0.85 + Math.random() * 0.15;

  // STAB
  if (attacker.types && attacker.types.includes(move.type)) damage *= 1.5;

  // Type effectiveness
  const effectiveness = getEffectiveness(move.type, defender.types || []);
  damage *= effectiveness;
  result.effectiveness = effectiveness;

  // Burn halves physical damage (Crystal behaviour)
  if (attacker.status === 'burn' && !isSpecial) damage *= 0.5;

  // Weather modifiers (Crystal: +50% / -50%)
  const weather = battleState.weather;
  if (weather && weather.type !== 'none' && weather.turns > 0) {
    if (weather.type === 'rain') {
      if (move.type === 'WATER') damage *= 1.5;
      if (move.type === 'FIRE')  damage *= 0.5;
    } else if (weather.type === 'sun') {
      if (move.type === 'FIRE')  damage *= 1.5;
      if (move.type === 'WATER') damage *= 0.5;
    }
  }

  // Screen modifiers (Reflect / Light Screen halve damage — Crystal behaviour)
  const defScreens = battleState.defenderScreens || defender.screens;
  if (!result.isCritical) { // Crits ignore screens
    if (!isSpecial && (defScreens?.reflect  || 0) > 0) damage *= 0.5;
    if ( isSpecial && (defScreens?.lightScreen || 0) > 0) damage *= 0.5;
  }

  result.finalDamage = Math.max(1, Math.floor(damage));
  return result;
};
