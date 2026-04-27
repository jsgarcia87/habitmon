/**
 * battleEngine.js
 * The "Brain" of the combat system. Manages turn order and sequence.
 */
import { calculateDamage } from './damageCalculator.js';
import { executeMoveEffect } from './moveEffects.js';

/**
 * Determines the order of moves based on priority and speed.
 */
export const determineTurnOrder = (pMove, pPkmn, eMove, ePkmn) => {
  const pPriority = pMove?.priority || 0;
  const ePriority = eMove?.priority || 0;

  if (pPriority > ePriority) return ['player', 'enemy'];
  if (ePriority > pPriority) return ['enemy', 'player'];

  // Priority tie, use Speed
  if (pPkmn.speed > ePkmn.speed) return ['player', 'enemy'];
  if (ePkmn.speed > pPkmn.speed) return ['enemy', 'player'];

  // Speed tie, random
  return Math.random() < 0.5 ? ['player', 'enemy'] : ['enemy', 'player'];
};

/**
 * Executes a single move and returns the summary of what happened.
 */
export const processMove = (attacker, defender, move) => {
  const summary = {
    attackerName: attacker.name,
    defenderName: defender.name,
    moveName: move.nombre,
    damageDealt: 0,
    isCritical: false,
    effectiveness: 1,
    effects: null,
    missed: false
  };

  // 1. Accuracy Check
  const accuracy = move.accuracy || 100;
  if (accuracy < 100 && Math.random() * 100 > accuracy) {
    summary.missed = true;
    return summary;
  }

  // 2. Damage Calculation
  const dmgResult = calculateDamage(attacker, defender, move);
  summary.damageDealt = dmgResult.finalDamage;
  summary.isCritical = dmgResult.isCritical;
  summary.effectiveness = dmgResult.effectiveness;

  // 3. Side Effects
  summary.effects = executeMoveEffect(move, attacker, defender);

  return summary;
};

/**
 * Applies end-of-turn effects like Poison damage.
 */
export const processEndTurnEffects = (pkmn) => {
  const effects = [];
  if (pkmn.status === 'poison') {
    const dmg = Math.floor(pkmn.maxHp / 8);
    pkmn.hp = Math.max(0, pkmn.hp - dmg);
    effects.push({ type: 'poison', damage: dmg, message: `¡${pkmn.name} sufre por el veneno!` });
  }
  // Add more as needed...
  return effects;
};
