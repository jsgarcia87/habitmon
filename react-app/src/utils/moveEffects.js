/**
 * moveEffects.js
 * Unified move effect system inspired by Pokémon Crystal (Gen 2).
 *
 * executeMoveEffect returns:
 *   message        – string to display
 *   statChanges    – [{ target: 'attacker'|'defender', stat, stage }]
 *   statusApplied  – 'poison'|'burn'|'paralysis'|'freeze'|'sleep'|null
 *   sleepTurns     – random 1-7 (only set when statusApplied = 'sleep')
 *   toxicApplied   – boolean (badly poisoned, separate from statusApplied)
 *   confused       – boolean (target becomes confused)
 *   recoilDamage   – number (damage taken by attacker)
 *   healAmount     – number (HP restored to attacker)
 *   weatherSet     – { type, turns } | null
 *   screenSet      – { side:'attacker'|'defender', type:'reflect'|'lightScreen', turns } | null
 *   leechSeed      – boolean (target is planted with Leech Seed)
 *   hitCount       – number of hits for MULTI_HIT / DOUBLE_HIT (handled in battleEngine)
 */
export const executeMoveEffect = (move, attacker, defender, damageDealt = 0) => {
  const result = {
    message: null,
    statChanges: [],
    statusApplied: null,
    sleepTurns: 0,
    toxicApplied: false,
    confused: false,
    recoilDamage: 0,
    healAmount: 0,
    weatherSet: null,
    screenSet: null,
    leechSeed: false,
  };

  const effect = move.effect;
  if (!effect) return result;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const rolls = (chance) => Math.random() * 100 < (chance || 0);
  const defStage = (stat) => defender.statStages?.[stat] || 0;
  const atkStage = (stat) => attacker.statStages?.[stat] || 0;

  switch (effect) {

    // ── Daño + efecto secundario con probabilidad ──────────────────────────
    case 'BURN_HIT':
      if (rolls(move.effectChance) && !defender.status && !defender.types.includes('FIRE')) {
        result.statusApplied = 'burn';
        result.message = `¡${defender.name} fue quemado!`;
      }
      break;

    case 'PARALYZE_HIT':
      if (rolls(move.effectChance) && !defender.status && !defender.types.includes('ELECTRIC')) {
        result.statusApplied = 'paralysis';
        result.message = `¡${defender.name} está paralizado!`;
      }
      break;

    case 'FREEZE_HIT':
      if (rolls(move.effectChance) && !defender.status && !defender.types.includes('ICE')) {
        result.statusApplied = 'freeze';
        result.message = `¡${defender.name} fue congelado!`;
      }
      break;

    case 'POISON_HIT':
      if (rolls(move.effectChance) && !defender.status
          && !defender.types.includes('POISON') && !defender.types.includes('STEEL')) {
        result.statusApplied = 'poison';
        result.message = `¡${defender.name} fue envenenado!`;
      }
      break;

    case 'CONFUSE_HIT':
      if (rolls(move.effectChance) && !defender.confused) {
        result.confused = true;
        result.message = `¡${defender.name} está confundido!`;
      }
      break;

    case 'LOWER_SPDEF_HIT':
      if (rolls(move.effectChance) && defStage('spDef') > -6) {
        result.statChanges.push({ target: 'defender', stat: 'spDef', stage: -1 });
        result.message = `¡La DEF. ESP. de ${defender.name} bajó!`;
      }
      break;

    case 'LOWER_DEF_HIT':
      if (rolls(move.effectChance) && defStage('defense') > -6) {
        result.statChanges.push({ target: 'defender', stat: 'defense', stage: -1 });
        result.message = `¡La DEFENSA de ${defender.name} bajó!`;
      }
      break;

    case 'RECOIL':
      result.recoilDamage = Math.max(1, Math.floor(damageDealt * (move.recoil || 0.25)));
      break;

    // DOUBLE_HIT / MULTI_HIT are resolved in battleEngine.js before reaching here
    case 'DOUBLE_HIT':
    case 'MULTI_HIT':
      break;

    // ── Condiciones de estado (moves de estado puros) ──────────────────────
    case 'APPLY_PARALYZE': {
      const isImmune = defender.status
        || defender.types.includes('ELECTRIC')
        || (move.type === 'ELECTRIC' && defender.types.includes('GROUND'));
      if (!isImmune) {
        result.statusApplied = 'paralysis';
        result.message = `¡${defender.name} está paralizado!`;
      } else {
        result.message = '¡No afectó!';
      }
      break;
    }

    case 'APPLY_POISON':
      if (!defender.status && !defender.types.includes('POISON') && !defender.types.includes('STEEL')) {
        result.statusApplied = 'poison';
        result.message = `¡${defender.name} fue envenenado!`;
      } else {
        result.message = '¡No afectó!';
      }
      break;

    case 'APPLY_TOXIC':
      if (!defender.status && !defender.types.includes('POISON') && !defender.types.includes('STEEL')) {
        result.toxicApplied = true;
        result.message = `¡${defender.name} fue gravemente envenenado!`;
      } else {
        result.message = '¡No afectó!';
      }
      break;

    case 'APPLY_SLEEP':
      if (!defender.status) {
        result.statusApplied = 'sleep';
        result.sleepTurns = 1 + Math.floor(Math.random() * 7); // 1–7 turnos (Crystal)
        result.message = `¡${defender.name} se quedó dormido!`;
      } else {
        result.message = '¡No afectó!';
      }
      break;

    case 'APPLY_CONFUSE':
      if (!defender.confused) {
        result.confused = true;
        result.message = `¡${defender.name} está confundido!`;
      } else {
        result.message = `¡${defender.name} ya está confundido!`;
      }
      break;

    // ── Bajada de estadísticas del defensor ───────────────────────────────
    case 'LOWER_ATK':
      if (defStage('attack') > -6) {
        result.statChanges.push({ target: 'defender', stat: 'attack', stage: -1 });
        result.message = `¡El ATAQUE de ${defender.name} bajó!`;
      } else {
        result.message = `¡El ATAQUE de ${defender.name} no puede bajar más!`;
      }
      break;

    case 'LOWER_DEF':
      if (defStage('defense') > -6) {
        result.statChanges.push({ target: 'defender', stat: 'defense', stage: -1 });
        result.message = `¡La DEFENSA de ${defender.name} bajó!`;
      } else {
        result.message = `¡La DEFENSA de ${defender.name} no puede bajar más!`;
      }
      break;

    case 'LOWER_ACC':
      if (defStage('accuracy') > -6) {
        result.statChanges.push({ target: 'defender', stat: 'accuracy', stage: -1 });
        result.message = `¡La PRECISIÓN de ${defender.name} bajó!`;
      } else {
        result.message = `¡La PRECISIÓN de ${defender.name} no puede bajar más!`;
      }
      break;

    case 'LOWER_SPD':
      if (defStage('speed') > -6) {
        result.statChanges.push({ target: 'defender', stat: 'speed', stage: -1 });
        result.message = `¡La VELOCIDAD de ${defender.name} bajó!`;
      } else {
        result.message = `¡La VELOCIDAD de ${defender.name} no puede bajar más!`;
      }
      break;

    case 'LOWER_SPD_2':
      if (defStage('speed') > -6) {
        result.statChanges.push({ target: 'defender', stat: 'speed', stage: -2 });
        result.message = `¡La VELOCIDAD de ${defender.name} bajó mucho!`;
      } else {
        result.message = `¡La VELOCIDAD de ${defender.name} no puede bajar más!`;
      }
      break;

    // ── Subida de estadísticas del atacante ───────────────────────────────
    case 'RAISE_ATK':
      if (atkStage('attack') < 6) {
        result.statChanges.push({ target: 'attacker', stat: 'attack', stage: 1 });
        result.message = `¡El ATAQUE de ${attacker.name} subió!`;
      } else {
        result.message = `¡El ATAQUE de ${attacker.name} no puede subir más!`;
      }
      break;

    case 'RAISE_ATK_2':
      if (atkStage('attack') < 6) {
        result.statChanges.push({ target: 'attacker', stat: 'attack', stage: 2 });
        result.message = `¡El ATAQUE de ${attacker.name} subió mucho!`;
      } else {
        result.message = `¡El ATAQUE de ${attacker.name} no puede subir más!`;
      }
      break;

    case 'RAISE_SPATK_2':
      if (atkStage('spAtk') < 6) {
        result.statChanges.push({ target: 'attacker', stat: 'spAtk', stage: 2 });
        result.message = `¡El ATQ. ESP. de ${attacker.name} subió mucho!`;
      } else {
        result.message = `¡El ATQ. ESP. de ${attacker.name} no puede subir más!`;
      }
      break;

    case 'RAISE_SPD_2':
      if (atkStage('speed') < 6) {
        result.statChanges.push({ target: 'attacker', stat: 'speed', stage: 2 });
        result.message = `¡La VELOCIDAD de ${attacker.name} subió mucho!`;
      } else {
        result.message = `¡La VELOCIDAD de ${attacker.name} no puede subir más!`;
      }
      break;

    case 'RAISE_SPATK_SPDEF':
      result.statChanges.push({ target: 'attacker', stat: 'spAtk', stage: 1 });
      result.statChanges.push({ target: 'attacker', stat: 'spDef', stage: 1 });
      result.message = `¡${attacker.name} se concentra y se fortalece!`;
      break;

    // ── Curación ──────────────────────────────────────────────────────────
    case 'HEALING':
      if (attacker.hp < attacker.maxHp) {
        result.healAmount = Math.floor(attacker.maxHp * 0.5);
        result.message = `¡${attacker.name} recuperó PS!`;
      } else {
        result.message = `¡${attacker.name} ya tiene todos sus PS!`;
      }
      break;

    // ── Barreras ──────────────────────────────────────────────────────────
    case 'SET_REFLECT':
      if ((attacker.screens?.reflect || 0) === 0) {
        result.screenSet = { side: 'attacker', type: 'reflect', turns: 5 };
        result.message = `¡${attacker.name} creó una barrera contra ataques físicos!`;
      } else {
        result.message = '¡Ya hay una barrera activa!';
      }
      break;

    case 'SET_LIGHT_SCREEN':
      if ((attacker.screens?.lightScreen || 0) === 0) {
        result.screenSet = { side: 'attacker', type: 'lightScreen', turns: 5 };
        result.message = `¡${attacker.name} creó una barrera contra ataques especiales!`;
      } else {
        result.message = '¡Ya hay una barrera activa!';
      }
      break;

    // ── Látex ─────────────────────────────────────────────────────────────
    case 'LEECH_SEED':
      if (!defender.leeched && !defender.types.includes('GRASS')) {
        result.leechSeed = true;
        result.message = `¡Una semilla fue plantada en ${defender.name}!`;
      } else if (defender.types.includes('GRASS')) {
        result.message = '¡No afecta a los tipos PLANTA!';
      } else {
        result.message = '¡No afectó!';
      }
      break;

    // ── Clima ─────────────────────────────────────────────────────────────
    case 'SET_RAIN':
      result.weatherSet = { type: 'rain', turns: 5 };
      result.message = '¡Empezó a llover a cántaros!';
      break;

    case 'SET_SUN':
      result.weatherSet = { type: 'sun', turns: 5 };
      result.message = '¡La intensidad del sol aumentó!';
      break;

    case 'SET_SANDSTORM':
      result.weatherSet = { type: 'sandstorm', turns: 5 };
      result.message = '¡Se levantó una tormenta de arena!';
      break;

    default:
      break;
  }

  return result;
};
