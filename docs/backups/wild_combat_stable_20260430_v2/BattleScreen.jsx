import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import HPBar from '../components/HPBar';
import { getAssetPath } from '../api/assets';
import { safeDrawImage } from '../utils/gfxUtils';
import { MOVE_DATA, POKEMON_MOVES } from '../data/moveData';
import { createBattlePokemon, getPokemonByGym } from '../data/pokemonData';
import { determineTurnOrder, processMove, processEndTurnEffects } from '../utils/battleEngine';
import { 
  ANIM_TYPES, 
  updateBattleAnimations, 
  drawBattleAnimations, 
  getMoveAnimation,
  createAnimation
} from '../utils/battleAnimations';

// New Modular Components
import BattleHUD from '../components/battle/BattleHUD';
import BattleActionMenu from '../components/battle/BattleActionMenu';
import VictoryOverlay from '../components/battle/VictoryOverlay';

const INTRO_STATES = {
  FADE_IN:        'fadeIn',
  TRAINER_ENTER:  'trainerEnter',
  TRAINER_THROW:  'trainerThrow',
  BALL_FLY:       'ballFly',
  BALL_FLASH:     'ballFlash',
  POKEMON_APPEAR: 'pokemonAppear',
  HUD_SLIDE:      'hudSlide',
  READY:          'ready'
};

const BATTLE_PHASES = {
  SELECT: 'select',
  RESOLVING: 'resolving',
  FINISHED: 'finished'
};

const BattleScreen = ({ navigate, battleData, aPressed }) => {
  const { user, habitosHoy, completarHabito, starter, ganarBatalla, completarGimnasio } = useGame();
  
  const isWild = battleData?.tipo === 'wild' || battleData?.isWild || battleData?.type === 'encounter';
  const gymId = battleData?.gymId;

  const [phase, setPhase] = useState(BATTLE_PHASES.SELECT);
  const [menuView, setMenuView] = useState('main');
  const [message, setMessage] = useState('');
  const [introReady, setIntroReady] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  
  const [playerPkmn, setPlayerPkmn] = useState(null);
  const [enemyPkmn, setEnemyPkmn] = useState(null);
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [teamIndex, setTeamIndex] = useState(0);
  const [localCompleted, setLocalCompleted] = useState({});

  // Memoize habits to prevent flickering or recalculation errors
  const habitsForStage = useMemo(() => {
    if (!habitosHoy) return [];
    const normalizedGymId = String(gymId || '').toLowerCase();
    return habitosHoy.filter(h => {
      const isOfGym = gymId ? String(h.gym_id || '').toLowerCase() === normalizedGymId : true;
      const isActive = h.activo !== false && h.activo !== 0 && h.activo !== '0';
      const hId = h.habito_id || h.id;
      const isAlreadyCompleted = h.completado && !localCompleted[hId];
      return isOfGym && isActive && !isAlreadyCompleted;
    });
  }, [habitosHoy, gymId, localCompleted]);

  const activeAnimsRef = useRef([]);
  const playerOffsetRef = useRef({ x: 0, y: 0 });
  const enemyOffsetRef = useRef({ x: 0, y: 0 });
  const isFlashingRef = useRef(false);

  const [displayXp, setDisplayXp] = useState(0);
  const [displayMonedas, setDisplayMonedas] = useState(0);
  const [showContinueHint, setShowContinueHint] = useState(false);
  
  const battleCanvasRef = useRef(null);
  const trainerImgRef = useRef(null);
  const enemyImgRef = useRef(null);
  const bgImgRef = useRef(null);
  const playerPkImgRef = useRef(null);
  
  const introRef = useRef({
    state: INTRO_STATES.FADE_IN,
    timer: 0, fadeAlpha: 1, trainerX: -80, ballVisible: false, ballX: 0, ballY: 0,
    ballAngle: 0, enemyOpacity: 0, enemyScale: 1, enemyOffsetX: 0, flashAlpha: 0,
    enemyHudX: -200, playerHudX: 430, playerScale: 0.1
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const bg = new Image(); bg.src = getAssetPath('Graphics/battlebacks/general_bg.png'); bg.onload = () => { bgImgRef.current = bg; };
      const avatarNum = String(user?.avatar || 0).padStart(3,'0');
      const tr = new Image(); tr.src = getAssetPath(`Graphics/trainers/trback${avatarNum === '000' ? '000' : '001'}.png`); tr.onload = () => { trainerImgRef.current = tr; };
      
      const pInst = createBattlePokemon(starter.starter_id, starter.starter_nivel);
      let eTeam = [];
      if (isWild) {
        eTeam = [createBattlePokemon(battleData?.pokemon?.id || 16, battleData?.pokemon?.nivel || 5)];
      } else {
        const gymPokes = getPokemonByGym(gymId);
        eTeam = Array.isArray(gymPokes) ? gymPokes : [gymPokes];
      }

      pInst.moves = POKEMON_MOVES[Number(pInst.id)] || ['TACKLE'];
      
      // Ensure we set full state
      setPlayerPkmn({ ...pInst });
      setEnemyPkmn({ ...eTeam[0] });
      setEnemyTeam([...eTeam]);
      setTeamIndex(0);

      const enemyFormattedId = String(eTeam[0].id).padStart(3, '0');
      const en = new Image(); en.src = getAssetPath(`Graphics/battlers/${enemyFormattedId}.png`); en.onload = () => { enemyImgRef.current = en; };

      const pPk = new Image(); const starterId = String(pInst.id).padStart(3, '0');
      pPk.src = getAssetPath(`Graphics/battlers/${starterId}b.png`); pPk.onload = () => { playerPkImgRef.current = pPk; };
    } catch (err) {
      console.error("Battle Init Error:", err);
    }
  }, []);

  useEffect(() => {
    if (!victoryData) return;
    let xp = 0, coins = 0;
    const targetXp = victoryData.xpGained, targetCoins = victoryData.monedas;
    const interval = setInterval(() => {
      let changed = false;
      if (xp < targetXp) { xp = Math.min(targetXp, xp + Math.ceil(targetXp / 20)); setDisplayXp(xp); changed = true; }
      if (coins < targetCoins) { coins = Math.min(targetCoins, coins + Math.ceil(targetCoins / 15)); setDisplayMonedas(coins); changed = true; }
      if (!changed) { clearInterval(interval); setTimeout(() => setShowContinueHint(true), 500); }
    }, 40);
    return () => clearInterval(interval);
  }, [victoryData]);

  useEffect(() => {
    let lastTime = performance.now(), frameId;
    const loop = (now) => {
      const dt = now - lastTime; lastTime = now;
      if (battleCanvasRef.current) {
        const ctx = battleCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, 300, 200);
        updateIntro(dt);
        const { nextAnims, offsets } = updateBattleAnimations(activeAnimsRef.current, dt);
        activeAnimsRef.current = nextAnims;
        playerOffsetRef.current = offsets.player;
        enemyOffsetRef.current = offsets.enemy;
        drawIntro(ctx, 300, 200);
        drawBattleAnimations(ctx, activeAnimsRef.current, 300, 200);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const updateIntro = (dt) => {
    const intro = introRef.current;
    if (intro.state === INTRO_STATES.READY) return;
    intro.timer += dt;
    switch(intro.state) {
      case INTRO_STATES.FADE_IN:
        intro.fadeAlpha = Math.max(0, 1 - intro.timer / 400);
        if(intro.timer > 400) { intro.state = INTRO_STATES.TRAINER_ENTER; intro.timer = 0; }
        break;
      case INTRO_STATES.TRAINER_ENTER:
        intro.trainerX = Math.min(300 * 0.22, -100 + (intro.timer / 800) * (300 * 0.22 + 100));
        intro.enemyOpacity = Math.min(1, intro.timer / 800);
        intro.enemyOffsetX = Math.max(0, 150 - (intro.timer / 800) * 150);
        if(intro.timer > 800) { intro.state = INTRO_STATES.TRAINER_THROW; intro.timer = 0; }
        break;
      case INTRO_STATES.TRAINER_THROW:
        intro.trainerFrame = Math.min(4, Math.floor(intro.timer / 100));
        if(intro.timer > 500) { intro.ballVisible = true; intro.ballX = intro.trainerX + 40; intro.ballY = 200 * 0.65; intro.state = INTRO_STATES.BALL_FLY; intro.timer = 0; }
        break;
      case INTRO_STATES.BALL_FLY:
        const t = Math.min(1, intro.timer / 600);
        const bStartX = intro.trainerX + 50, bStartY = 200 * 0.52;
        intro.ballX = bStartX + (300 * 0.22 - bStartX) * t;
        intro.ballY = bStartY + (200 * 0.70 - bStartY) * t - Math.sin(t * Math.PI) * 55;
        intro.ballAngle += 0.28;
        intro.trainerX -= 4.5;
        if(intro.timer > 600) { intro.ballVisible = false; intro.state = INTRO_STATES.BALL_FLASH; intro.timer = 0; intro.sparkles = Array.from({length: 8}, (_, i) => ({ angle: (i / 8) * Math.PI * 2, dist: 0, speed: 2 + Math.random() * 2 })); }
        break;
      case INTRO_STATES.BALL_FLASH:
        intro.flashAlpha = Math.max(0, 1 - intro.timer / 300);
        if (intro.sparkles) intro.sparkles.forEach(s => s.dist += s.speed);
        if (intro.timer > 50) {
          const tPop = intro.timer - 50;
          if (tPop < 200) { intro.playerScale = 0.1 + (tPop / 200) * 1.05; intro.playerShake = Math.sin(intro.timer * 0.1) * 2; }
          else { intro.playerScale = Math.max(1, 1.15 - ((tPop - 200) / 100) * 0.15); intro.playerShake = 0; }
        }
        if(intro.timer > 400) { intro.state = INTRO_STATES.POKEMON_APPEAR; intro.timer = 0; }
        break;
      case INTRO_STATES.POKEMON_APPEAR:
        if(intro.timer > 400) { 
          const name = enemyPkmn?.name.toUpperCase() || 'ENEMIGO';
          setMessage(isWild ? `¡${name} SALVAJE APARECIÓ!` : `¡EL LÍDER TE DESAFÍA CON ${name}!`);
          intro.state = INTRO_STATES.HUD_SLIDE; intro.timer = 0; 
        }
        break;
      case INTRO_STATES.HUD_SLIDE:
        intro.enemyHudX = Math.min(8, -200 + (intro.timer/400) * 208); 
        intro.playerHudX = Math.max(300-192-8, 430 - (intro.timer / 400) * 330);
        if(intro.timer > 400) { intro.state = INTRO_STATES.READY; setMessage(''); setIntroReady(true); }
        break;
      default: break;
    }
  };

  const drawIntro = (ctx, W, H) => {
    const intro = introRef.current;
    if (bgImgRef.current) safeDrawImage(ctx, bgImgRef.current, 0, 0, W, H);
    else { ctx.fillStyle = '#d8d0c0'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.beginPath(); ctx.ellipse(W * 0.22 + playerOffsetRef.current.x, H * 0.83, 32, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W * 0.73 + enemyOffsetRef.current.x + (intro.enemyOffsetX || 0), H * 0.57, 28, 6, 0, 0, Math.PI * 2); ctx.fill();
    if (intro.state !== INTRO_STATES.READY && trainerImgRef.current) {
      const img = trainerImgRef.current, frameW = img.width / 5, frame = intro.trainerFrame || 0;
      safeDrawImage(ctx, img, frame * frameW, 0, frameW, img.height, intro.trainerX, H * 0.38, 80, 108);
    }
    if (intro.enemyOpacity > 0 && enemyImgRef.current && enemyOffsetRef.current.visible) {
      ctx.save(); ctx.globalAlpha = intro.enemyOpacity * (enemyOffsetRef.current.opacity ?? 1);
      const eScale = (enemyOffsetRef.current.scale ?? 1) * (intro.enemyScale || 1);
      ctx.translate(W * 0.73 + enemyOffsetRef.current.x + (intro.enemyOffsetX || 0), H * 0.38 + enemyOffsetRef.current.y);
      ctx.scale(eScale, eScale); safeDrawImage(ctx, enemyImgRef.current, -48, -48, 96, 96); ctx.restore();
    }
    if ([INTRO_STATES.BALL_FLASH, INTRO_STATES.POKEMON_APPEAR, INTRO_STATES.HUD_SLIDE, INTRO_STATES.READY].includes(intro.state) && playerPkImgRef.current && playerOffsetRef.current.visible) {
      ctx.save(); ctx.globalAlpha = playerOffsetRef.current.opacity ?? 1;
      const pScale = (playerOffsetRef.current.scale ?? 1) * (intro.playerScale || 1);
      ctx.translate(W * 0.22 + playerOffsetRef.current.x + (intro.playerShake || 0), H * 0.70 + playerOffsetRef.current.y);
      ctx.scale(pScale, pScale); safeDrawImage(ctx, playerPkImgRef.current, -48, -48, 96, 96); ctx.restore();
    }
    if (intro.ballVisible) {
      ctx.save(); ctx.translate(intro.ballX, intro.ballY); ctx.rotate(intro.ballAngle);
      ctx.fillStyle = '#E8190C'; ctx.beginPath(); ctx.arc(0, 0, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (intro.flashAlpha > 0) {
      if (intro.sparkles) { ctx.fillStyle = '#fff'; intro.sparkles.forEach(s => { ctx.beginPath(); ctx.arc(W*0.22+Math.cos(s.angle)*s.dist, H*0.7+Math.sin(s.angle)*s.dist, 3*intro.flashAlpha, 0, Math.PI*2); ctx.fill(); }); }
      ctx.fillStyle = `rgba(255,255,255,${intro.flashAlpha})`; ctx.fillRect(0, 0, W, H);
    }
    if (intro.fadeAlpha > 0) { ctx.fillStyle = `rgba(0,0,0,${intro.fadeAlpha})`; ctx.fillRect(0, 0, W, H); }
  };

  const resolveTurn = async (pMoveKey) => {
    if (phase !== BATTLE_PHASES.SELECT) return;
    setPhase(BATTLE_PHASES.RESOLVING);
    
    const pMove = MOVE_DATA[pMoveKey];
    const eMoves = POKEMON_MOVES[Number(enemyPkmn.id)] || ['TACKLE'];
    const eMove = MOVE_DATA[eMoves[Math.floor(Math.random() * eMoves.length)]];
    
    const order = determineTurnOrder(pMove, playerPkmn, eMove, enemyPkmn);
    
    for (const side of order) {
      if (playerPkmn.hp <= 0 || enemyPkmn.hp <= 0) break;
      
      const attacker = side === 'player' ? playerPkmn : enemyPkmn;
      const defender = side === 'player' ? enemyPkmn : playerPkmn;
      const move = side === 'player' ? pMove : eMove;
      
      // 1. Attack Animation & Message
      setMessage(`¡${attacker.name.toUpperCase()} USÓ ${move.nombre.toUpperCase()}!`);
      activeAnimsRef.current = getMoveAnimation(move.id, side === 'player', 300, 200);
      await new Promise(r => setTimeout(r, 800));
      
      const result = processMove(attacker, defender, move);
      
      // 2. Handle Miss / Inability to move
      if (result.unableToMove || result.missed) {
        setMessage(result.unableToMove || `¡El ataque de ${attacker.name.toUpperCase()} falló!`);
        await new Promise(r => setTimeout(r, 1200));
        continue;
      }
      
      // 3. Apply Damage
      if (result.damageDealt > 0) {
        isFlashingRef.current = true;
        setTimeout(() => isFlashingRef.current = false, 100);
        
        if (side === 'player') {
          setEnemyPkmn(prev => ({ ...prev, hp: Math.max(0, prev.hp - result.damageDealt) }));
        } else {
          setPlayerPkmn(prev => ({ ...prev, hp: Math.max(0, prev.hp - result.damageDealt) }));
        }
        
        activeAnimsRef.current.push(createAnimation(ANIM_TYPES.TEXT, { 
          text: `-${result.damageDealt}`, 
          x: side === 'enemy' ? 300 * 0.25 : 300 * 0.75, 
          y: side === 'enemy' ? 200 * 0.7 - 20 : 200 * 0.35 - 20, 
          color: '#f00', 
          duration: 800 
        }));
        
        await new Promise(r => setTimeout(r, 600));
        
        if (result.isCritical) {
          setMessage("¡Un golpe crítico!");
          await new Promise(r => setTimeout(r, 1000));
        }
        
        if (result.effectiveness > 1) {
          setMessage("¡Es muy eficaz!");
          await new Promise(r => setTimeout(r, 1000));
        } else if (result.effectiveness < 1 && result.effectiveness > 0) {
          setMessage("No es muy eficaz...");
          await new Promise(r => setTimeout(r, 1000));
        } else if (result.effectiveness === 0) {
          setMessage("¡No afecta!");
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      // 4. Apply Secondary Effects (Status / Stats)
      if (result.effects) {
        const { message: effectMsg, statChanges, statusApplied } = result.effects;
        
        if (statusApplied || (statChanges && statChanges.length > 0)) {
          if (statusApplied) {
            if (side === 'player') setEnemyPkmn(prev => ({ ...prev, status: statusApplied }));
            else setPlayerPkmn(prev => ({ ...prev, status: statusApplied }));
          }
          
          if (statChanges && statChanges.length > 0) {
            statChanges.forEach(sc => {
              const targetSetter = (side === 'player' ? (sc.target === 'defender' ? setEnemyPkmn : setPlayerPkmn) : (sc.target === 'defender' ? setPlayerPkmn : setEnemyPkmn));
              targetSetter(prev => ({
                ...prev,
                statStages: {
                  ...prev.statStages,
                  [sc.stat]: Math.max(-6, Math.min(6, (prev.statStages?.[sc.stat] || 0) + sc.stage))
                }
              }));
            });
          }
          
          if (effectMsg) {
            setMessage(effectMsg);
            await new Promise(r => setTimeout(r, 1200));
          }
        }
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
    // 5. End Turn Effects (Poison, etc.)
    const sides = ['player', 'enemy'];
    for (const s of sides) {
      const pkmn = s === 'player' ? playerPkmn : enemyPkmn;
      const setter = s === 'player' ? setPlayerPkmn : setEnemyPkmn;
      if (pkmn.hp > 0) {
        const endEffects = processEndTurnEffects(pkmn);
        for (const eff of endEffects) {
          setMessage(eff.message);
          if (eff.damage) {
            setter(prev => ({ ...prev, hp: Math.max(0, prev.hp - eff.damage) }));
            isFlashingRef.current = true;
            setTimeout(() => isFlashingRef.current = false, 100);
          }
          await new Promise(r => setTimeout(r, 1200));
        }
      }
    }
    
    if (playerPkmn.hp > 0 && enemyPkmn.hp > 0) {
      setPhase(BATTLE_PHASES.SELECT);
      setMessage('');
    } else {
      endBattle(enemyPkmn.hp <= 0);
    }
  };

  const handleHabitAttack = async (h) => {
    if (phase !== BATTLE_PHASES.SELECT || localCompleted[h.habito_id || h.id]) return;
    setPhase(BATTLE_PHASES.RESOLVING);
    const hId = h.habito_id || h.id;
    setLocalCompleted(prev => ({...prev, [hId]: true}));
    
    const totalInBattle = habitsForStage.length || 1;
    const totalTeamMaxHp = enemyTeam.reduce((sum, p) => sum + (Number(p.maxHp) || 50), 0);
    let damageDealt = Math.ceil(totalTeamMaxHp / totalInBattle);
    
    if (Object.keys(localCompleted).length + 1 === habitsForStage.length) {
      damageDealt = Number(enemyPkmn.hp) + 10;
    }

    setMessage(`¡${playerPkmn.name.toUpperCase()} usó ${h.nombre.toUpperCase()}!`);
    activeAnimsRef.current = [
      createAnimation(ANIM_TYPES.BOUNCE, { target: 'player', duration: 300, amount: 20 }),
      createAnimation(ANIM_TYPES.STRIKE, { x: 300 * 0.75, y: 200 * 0.35, duration: 600, color: '#00ff00' }),
      createAnimation(ANIM_TYPES.SHAKE, { target: 'enemy', duration: 400, amount: 15 }),
      createAnimation(ANIM_TYPES.FLASH_SPRITE, { target: 'enemy', duration: 400 }),
      createAnimation(ANIM_TYPES.TEXT, { text: `-${damageDealt}`, x: 300 * 0.75, y: 200 * 0.35 - 20, color: '#f00', duration: 800 })
    ];

    completarHabito(h.gym_id, hId).catch(console.error);

    setTimeout(() => {
      isFlashingRef.current = true; setTimeout(() => isFlashingRef.current = false, 150);
      setEnemyPkmn(prev => {
        if (prev.hp > damageDealt) {
          setTimeout(() => { setPhase(BATTLE_PHASES.SELECT); setMessage(''); }, 800);
          return { ...prev, hp: prev.hp - damageDealt };
        } else {
          const carry = damageDealt - prev.hp;
          if (teamIndex < enemyTeam.length - 1) {
            const nextIdx = teamIndex + 1, nextPkmn = enemyTeam[nextIdx];
            setTimeout(() => {
              setMessage(`¡${prev.name.toUpperCase()} se debilitó!`);
              setTimeout(() => {
                setTeamIndex(nextIdx); setEnemyPkmn({ ...nextPkmn, hp: Math.max(0, nextPkmn.maxHp - carry) });
                const img = new Image(); img.src = getAssetPath(`Graphics/battlers/${String(nextPkmn.id).padStart(3,'0')}.png`); img.onload = () => { enemyImgRef.current = img; };
                setMessage(`¡El líder envía a ${nextPkmn.name.toUpperCase()}!`); setPhase(BATTLE_PHASES.SELECT);
              }, 1200);
            }, 600);
          } else {
            setTimeout(() => { setMessage(`¡${prev.name.toUpperCase()} se debilitó!`); setTimeout(() => endBattle(true), 1000); }, 600);
          }
          return { ...prev, hp: 0 };
        }
      });
    }, 600);
  };

  const endBattle = async (win) => {
    setPhase(BATTLE_PHASES.FINISHED);
    if (!win) {
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.FAINT, { target: 'player', duration: 1000 }));
      await new Promise(r => setTimeout(r, 1200)); setMessage(`¡${playerPkmn.name.toUpperCase()} se debilitó!`);
      await new Promise(r => setTimeout(r, 1500)); navigate('city');
    } else {
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.FAINT, { target: 'enemy', targetX: 300*0.73, targetY: 200*0.38, duration: 2500 }));
      await new Promise(r => setTimeout(r, 2700));
      const gymReward = !isWild ? await completarGimnasio(gymId, starter.starter_id, starter.starter_nombre).catch(() => ({})) : {};
      const reward = await ganarBatalla().catch(() => ({}));
      setVictoryData({
        type: isWild ? 'wild' : 'gym', enemyName: enemyPkmn.name, gymName: battleData?.gymName || 'GIMNASIO',
        xpGained: (gymReward?.exp_ganada || 0) + (reward?.xp_ganada || 20),
        newXp: gymReward?.new_xp || reward?.new_xp || 0,
        newLevel: gymReward?.nuevo_nivel || reward?.new_level || playerPkmn.level,
        levelUp: gymReward?.subio_nivel || reward?.subio_nivel,
        monedas: (gymReward?.monedas_ganadas || 0) + (reward?.monedas_ganadas || 0),
        medallaUrl: gymReward?.medalla_imagen || null,
      });
    }
  };

  if (!playerPkmn || !enemyPkmn) return null;

  return (
    <div style={{ width: '100vw', height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#222', overflow: 'hidden', fontFamily:'"Press Start 2P"' }}>
      <div style={{ width: '100%', maxWidth: '480px', height: '100%', display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
        <div style={{flex: '0 0 58%', position:'relative', overflow: 'hidden'}}>
          <canvas ref={battleCanvasRef} width={300} height={200} style={{width:'100%',height:'100%', imageRendering:'pixelated'}} />
          <BattleHUD enemyPkmn={enemyPkmn} playerPkmn={playerPkmn} starterExp={starter.starter_exp} introReady={introReady} />
        </div>
        <div style={{ flex: '0 0 42%', background: '#f0f0f0', borderTop: '4px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: '#f8f8f0', borderBottom: '3px solid #444', padding: '10px 16px', minHeight: '52px', display: 'flex', alignItems: 'center', fontSize: 9, color: '#222', lineHeight: '1.5em' }}>
            {message || (isWild ? '¿QUÉ DEBE HACER?' : '¡COMPLETA TUS HÁBITOS!')}
          </div>
          <BattleActionMenu isWild={isWild} menuView={menuView} setMenuView={setMenuView} phase={phase} habitsForStage={habitsForStage} localCompleted={localCompleted} handleHabitAttack={handleHabitAttack} moves={playerPkmn?.moves || []} onMoveSelect={resolveTurn} setMessage={setMessage} navigate={navigate} />
        </div>
        <VictoryOverlay victoryData={victoryData} displayXp={displayXp} displayMonedas={displayMonedas} showContinueHint={showContinueHint} onClose={() => navigate('city')} />
        <style>{`
          .battle-btn { background: #e8e8d8; border: 2px solid #666; border-radius: 3px; font-family: "Press Start 2P", monospace; font-size: 8px; color: #222; cursor: pointer; display: flex; align-items: center; justify-content: center; text-align: center; padding: 4px 2px; }
          .battle-btn:hover:not(:disabled) { background: #d0d0c0; }
          .battle-btn-gym { background: #fff; border: 2px solid #555; border-radius: 6px; font-family: "Press Start 2P", monospace; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 4px; }
          .battle-btn-gym:disabled { opacity: 0.4; cursor: default; background: #ddd; }
        `}</style>
      </div>
    </div>
  );
};

export default BattleScreen;
