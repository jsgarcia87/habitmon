/**
 * battleEngine.js
 * Core battle logic inspired by Pokémon Crystal (Gen 2).
 */
import { calculateDamage } from './damageCalculator.js';
import { executeMoveEffect } from './moveEffects.js';

// ── Orden de turno ────────────────────────────────────────────────────────────
export const determineTurnOrder = (pMove, pPkmn, eMove, ePkmn) => {
  const pPri = pMove?.priority || 0;
  const ePri = eMove?.priority || 0;

  if (pPri > ePri) return ['player', 'enemy'];
  if (ePri > pPri) return ['enemy', 'player'];

  let pSpd = pPkmn.speed || 10;
  let eSpd = ePkmn.speed || 10;
  if (pPkmn.status === 'paralysis') pSpd = Math.floor(pSpd * 0.25); // Crystal: /4
  if (ePkmn.status === 'paralysis') eSpd = Math.floor(eSpd * 0.25);

  if (pSpd > eSpd) return ['player', 'enemy'];
  if (eSpd > pSpd) return ['enemy', 'player'];

  return Math.random() < 0.5 ? ['player', 'enemy'] : ['enemy', 'player'];
};

// ── Multiplicador de precisión / evasión ──────────────────────────────────────
const getAccuracyMultiplier = (accStage = 0, evaStage = 0) => {
  const stage = Math.max(-6, Math.min(6, accStage - evaStage));
  const num = Math.max(3, 3 + stage);
  const den = Math.max(3, 3 - stage);
  return num / den;
};

// ── Daño de auto-golpe por confusión (Crystal: 40 power, sin tipo, stats propios) ──
const calcConfusionSelfDamage = (pkmn) => {
  const level = pkmn.level || 5;
  const atk = pkmn.attack || 10;
  const def = pkmn.defense || 10;
  return Math.max(1, Math.floor(((2 * level / 5 + 2) * 40 * atk / def) / 50 + 2));
};

/**
 * Ejecuta un movimiento.
 * battleState = { weather: {type, turns} }
 *
 * Devuelve summary con:
 *   damageDealt, hitCount, isCritical, effectiveness,
 *   effects (resultado de executeMoveEffect),
 *   missed, unableToMove,
 *   wakeUp, decrementSleep, thawed,
 *   confusionCleared, confusionSelfHit, newConfuseTurns,
 *   recoilDamage
 */
export const processMove = (attacker, defender, move, battleState = {}) => {
  const summary = {
    attackerName:    attacker.name,
    defenderName:    defender.name,
    moveName:        move.nombre,
    damageDealt:     0,
    hitCount:        1,
    isCritical:      false,
    effectiveness:   1,
    effects:         null,
    missed:          false,
    unableToMove:    null,
    // Estado volátil
    wakeUp:          false,
    decrementSleep:  false,
    thawed:          false,
    confusionCleared: false,
    confusionSelfHit: 0,
    newConfuseTurns:  0,
    recoilDamage:    0,
  };

  // ── 0. Chequeos de condición ANTES de mover (Crystal order) ───────────────

  // Sueño
  if (attacker.status === 'sleep') {
    const turnsLeft = attacker.sleepTurns || 0;
    if (turnsLeft <= 0) {
      summary.wakeUp = true;
      summary.unableToMove = `¡${attacker.name} despertó!`;
    } else {
      summary.decrementSleep = true;
      summary.unableToMove = `¡${attacker.name} está dormido!`;
    }
    return summary;
  }

  // Congelación (Crystal: 20% de descongelarse cada turno)
  if (attacker.status === 'freeze') {
    if (Math.random() < 0.2) {
      summary.thawed = true;
      summary.unableToMove = `¡${attacker.name} se descongeló!`;
    } else {
      summary.unableToMove = `¡${attacker.name} está congelado!`;
    }
    return summary;
  }

  // Parálisis (Crystal: 25% de no poder moverse)
  if (attacker.status === 'paralysis' && Math.random() < 0.25) {
    summary.unableToMove = '¡Está paralizado! ¡No se puede mover!';
    return summary;
  }

  // Confusión (Crystal: 50% de auto-golpearse, cuenta atrás 2-5 turnos)
  if (attacker.confused) {
    const remaining = (attacker.confuseTurns || 1) - 1;
    if (remaining <= 0) {
      summary.confusionCleared = true;
      summary.newConfuseTurns = 0;
      // Cura pero sigue moviendo ese turno
    } else {
      summary.newConfuseTurns = remaining;
      if (Math.random() < 0.5) {
        summary.confusionSelfHit = calcConfusionSelfDamage(attacker);
        return summary; // Se golpea a sí mismo, no ejecuta el move
      }
    }
  }

  // ── 1. Chequeo de precisión ───────────────────────────────────────────────
  const baseAcc = move.accuracy ?? 100;
  if (baseAcc < 100) {
    const accMult = getAccuracyMultiplier(
      attacker.statStages?.accuracy || 0,
      defender.statStages?.evasion  || 0
    );
    if (Math.random() * 100 > baseAcc * accMult) {
      summary.missed = true;
      return summary;
    }
  }

  // ── 2. Movimientos de estado puros (sin daño) ────────────────────────────
  if (move.category === 'status' || move.power === 0) {
    summary.effects = executeMoveEffect(move, attacker, defender, 0);
    return summary;
  }

  // ── 3. Multi-golpe (DOUBLE_HIT / MULTI_HIT) ──────────────────────────────
  if (move.effect === 'DOUBLE_HIT') {
    const dmg1 = calculateDamage(attacker, defender, move, battleState);
    const dmg2 = calculateDamage(attacker, defender, move, {
      ...battleState,
      defenderScreens: defender.screens // segunda hit también pasa por pantallas
    });
    summary.damageDealt  = dmg1.finalDamage + dmg2.finalDamage;
    summary.hitCount     = 2;
    summary.effectiveness = dmg1.effectiveness;
    summary.effects      = executeMoveEffect(move, attacker, defender, summary.damageDealt);
    return summary;
  }

  if (move.effect === 'MULTI_HIT') {
    // Crystal: 37.5 / 37.5 / 12.5 / 12.5 % para 2/3/4/5 golpes
    const r = Math.random();
    const hits = r < 0.375 ? 2 : r < 0.75 ? 3 : r < 0.875 ? 4 : 5;
    let total = 0;
    let lastResult = { effectiveness: 1 };
    for (let i = 0; i < hits; i++) {
      const dmg = calculateDamage(attacker, defender, move, battleState);
      total += dmg.finalDamage;
      lastResult = dmg;
    }
    summary.damageDealt  = total;
    summary.hitCount     = hits;
    summary.effectiveness = lastResult.effectiveness;
    summary.effects      = executeMoveEffect(move, attacker, defender, total);
    return summary;
  }

  // ── 4. Daño normal ────────────────────────────────────────────────────────
  const defenderScreens = {
    reflect:     defender.screens?.reflect     || 0,
    lightScreen: defender.screens?.lightScreen || 0,
  };
  const dmgResult = calculateDamage(attacker, defender, move, {
    ...battleState,
    defenderScreens,
  });
  summary.damageDealt  = dmgResult.finalDamage;
  summary.isCritical   = dmgResult.isCritical;
  summary.effectiveness = dmgResult.effectiveness;

  // ── 5. Efectos secundarios ────────────────────────────────────────────────
  const eff = executeMoveEffect(move, attacker, defender, summary.damageDealt);
  summary.effects      = eff;
  summary.recoilDamage = eff.recoilDamage || 0;

  return summary;
};

/**
 * Efectos de fin de turno (veneno, quemadura, látex, tóxico, clima).
 * Pasa el Pokémon propio y el enemigo para poder calcular el drenadje de látex.
 *
 * Devuelve array de efectos:
 *   { type, damage, leechHeal, toxicCounter, message }
 */
export const processEndTurnEffects = (pkmn, weather = null) => {
  const effects = [];

  // Quemadura — Crystal: 1/8 PS máx por turno
  if (pkmn.status === 'burn') {
    const dmg = Math.max(1, Math.floor(pkmn.maxHp / 8));
    effects.push({ type: 'burn', damage: dmg, message: `¡${pkmn.name} sufre por la quemadura!` });
  }

  // Veneno normal — Crystal: 1/8 PS máx por turno
  if (pkmn.status === 'poison') {
    const dmg = Math.max(1, Math.floor(pkmn.maxHp / 8));
    effects.push({ type: 'poison', damage: dmg, message: `¡${pkmn.name} sufre por el veneno!` });
  }

  // Tóxico — Crystal: daño escalante (1/16 * contador), contador ++
  if (pkmn.status === 'toxic') {
    const counter = pkmn.toxicCounter || 1;
    const dmg = Math.max(1, Math.floor(pkmn.maxHp * counter / 16));
    effects.push({
      type: 'toxic',
      damage: dmg,
      toxicCounter: counter + 1,
      message: `¡${pkmn.name} sufre por el tóxico!`,
    });
  }

  // Látex — Crystal: drena 1/8 PS máx por turno (devuelto al contrario)
  if (pkmn.leeched) {
    const dmg = Math.max(1, Math.floor(pkmn.maxHp / 8));
    effects.push({
      type: 'leech',
      damage: dmg,
      leechHeal: dmg,
      message: `¡La energía de ${pkmn.name} es absorbida!`,
    });
  }

  // Clima: Tormenta de arena — Crystal: 1/16 PS a quien no sea ROCA/ACERO/TIERRA
  if (weather?.type === 'sandstorm' && (weather.turns || 0) > 0) {
    const immune = pkmn.types.some(t => ['ROCK', 'STEEL', 'GROUND'].includes(t));
    if (!immune) {
      const dmg = Math.max(1, Math.floor(pkmn.maxHp / 16));
      effects.push({ type: 'sandstorm', damage: dmg, message: `¡${pkmn.name} es golpeado por la tormenta de arena!` });
    }
  }

  return effects;
};
