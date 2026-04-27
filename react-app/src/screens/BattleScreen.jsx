import React, { useState, useEffect, useRef } from 'react';
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
  const { user, habitosHoy, completarHabito, starter, capturarPokemon, completarGimnasio, ganarBatalla } = useGame();
  
  if (!user || !habitosHoy || !starter) {
    return (
      <div style={{width:'100vw', height:'100dvh', background:'#000', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'"Press Start 2P"', fontSize: 8, gap: 20}}>
        <div>Cargando datos del combate...</div>
        <button 
          onClick={() => navigate('city')}
          style={{ padding: '8px 16px', background: '#333', color: '#fff', border: '1px solid #666', cursor: 'pointer', fontSize: 8 }}
        >
          VOLVER AL MAPA
        </button>
      </div>
    );
  }

  const isWild = battleData?.tipo === 'wild' || battleData?.isWild || battleData?.type === 'encounter';
  const gymId = battleData?.gymId;
  
  const [phase, setPhase] = useState(BATTLE_PHASES.SELECT);
  const [menuView, setMenuView] = useState('main');
  const [message, setMessage] = useState('');
  
  // Essentials Battle Instances
  const [playerPkmn, setPlayerPkmn] = useState(null);
  const [enemyPkmn, setEnemyPkmn] = useState(null);
  
  const [localCompleted, setLocalCompleted] = useState({});
  const activeAnimsRef = useRef([]);
  const playerOffsetRef = useRef({ x: 0, y: 0 });
  const enemyOffsetRef = useRef({ x: 0, y: 0 });
  const isFlashingRef = useRef(false);
  
  const battleCanvasRef = useRef(null);
  const trainerImgRef = useRef(null);
  const enemyImgRef = useRef(null);
  const bgImgRef = useRef(null);
  const playerPkImgRef = useRef(null);
  
  const introRef = useRef({
    state: INTRO_STATES.FADE_IN,
    timer: 0, fadeAlpha: 1, trainerX: -80, ballVisible: false, ballX: 0, ballY: 0,
    ballAngle: 0, enemyOpacity: 0, enemyScale: 0.1, enemyOffsetX: 0, flashAlpha: 0,
    enemyHudX: -200, playerHudX: 430
  });

  // Initialization
  useEffect(() => {
    // Assets
    const bg = new Image(); bg.src = getAssetPath('Graphics/battlebacks/general_bg.png'); bg.onload = () => { bgImgRef.current = bg; };
    const avatarNum = String(user?.avatar || 0).padStart(3,'0');
    const tr = new Image(); tr.src = getAssetPath(`Graphics/trainers/trback${avatarNum === '000' ? '000' : '001'}.png`); tr.onload = () => { trainerImgRef.current = tr; };
    
    // Core Data Initialization
    const pInst = createBattlePokemon(starter.starter_id, starter.starter_nivel);
    const eInst = isWild 
      ? createBattlePokemon(battleData?.pokemon?.id || 16, battleData?.pokemon?.nivel || 5)
      : getPokemonByGym(gymId);

    setPlayerPkmn(pInst);
    setEnemyPkmn(eInst);

    const enemyFormattedId = String(eInst.id).padStart(3, '0');
    const en = new Image(); en.src = getAssetPath(`Graphics/battlers/${enemyFormattedId}.png`); en.onload = () => { enemyImgRef.current = en; };

    const pPk = new Image(); const starterId = String(pInst.id).padStart(3, '0');
    pPk.src = getAssetPath(`Graphics/battlers/${starterId}b.png`); pPk.onload = () => { playerPkImgRef.current = pPk; };

  }, [user, starter, isWild, gymId, battleData]);

  // Game Loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameId;
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
        intro.trainerX = Math.min(300 * 0.22, -80 + (intro.timer / 600) * (300 * 0.22 + 80));
        if(intro.timer > 600) { intro.state = INTRO_STATES.TRAINER_THROW; intro.timer = 0; }
        break;
      case INTRO_STATES.TRAINER_THROW:
        if(intro.timer > 400) { intro.ballVisible = true; intro.ballX = intro.trainerX + 40; intro.ballY = 200 * 0.65; intro.state = INTRO_STATES.BALL_FLY; intro.timer = 0; }
        break;
      case INTRO_STATES.BALL_FLY:
        const t = Math.min(1, intro.timer / 500);
        intro.ballX = (intro.trainerX + 40) + (300 * 0.72 - (intro.trainerX + 40)) * t;
        intro.ballY = (200 * 0.65) + (200 * 0.44 - (200 * 0.65)) * t - Math.sin(t * Math.PI) * 200 * 0.3;
        intro.ballAngle += 0.25;
        if(intro.timer > 500) { intro.ballVisible = false; intro.state = INTRO_STATES.BALL_FLASH; intro.timer = 0; }
        break;
      case INTRO_STATES.BALL_FLASH:
        intro.flashAlpha = Math.max(0, 1 - intro.timer / 300); intro.enemyOpacity = Math.min(1, intro.timer / 300); intro.enemyScale = Math.min(1, 0.1 + (intro.timer / 300) * 0.9);
        if(intro.timer > 300) { intro.state = INTRO_STATES.POKEMON_APPEAR; intro.timer = 0; }
        break;
      case INTRO_STATES.POKEMON_APPEAR:
        if(intro.timer > 200) { setMessage(`¡${enemyPkmn?.name.toUpperCase() || 'ENEMIGO'} SALVAJE APARECIÓ!`); intro.state = INTRO_STATES.HUD_SLIDE; intro.timer = 0; }
        break;
      case INTRO_STATES.HUD_SLIDE:
        intro.enemyHudX = Math.min(8, -200 + (intro.timer/300) * 208); intro.playerHudX = Math.max(300-192-8, 430 - (intro.timer / 300) * 330);
        if(intro.timer > 300) { intro.state = INTRO_STATES.READY; setMessage(''); }
        break;
      default: break;
    }
  };

  const drawIntro = (ctx, W, H) => {
    const intro = introRef.current;
    if(bgImgRef.current) safeDrawImage(ctx, bgImgRef.current, 0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(W * 0.25 + playerOffsetRef.current.x, H * 0.85, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W * 0.75 + enemyOffsetRef.current.x, H * 0.5, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
    if(intro.state !== INTRO_STATES.READY && trainerImgRef.current) {
        const img = trainerImgRef.current; safeDrawImage(ctx, img, 0, 0, img.width/5, img.height, intro.trainerX, H*0.55, 64, 80);
    }
    if(intro.enemyOpacity > 0 && enemyImgRef.current) {
      ctx.globalAlpha = intro.enemyOpacity; ctx.save(); ctx.translate(W * 0.75 + enemyOffsetRef.current.x, H * 0.35 + enemyOffsetRef.current.y); ctx.scale(intro.enemyScale, intro.enemyScale);
      safeDrawImage(ctx, enemyImgRef.current, -48, -48, 96, 96); ctx.restore(); ctx.globalAlpha = 1;
    }
    if(intro.state === INTRO_STATES.READY && playerPkImgRef.current) {
      safeDrawImage(ctx, playerPkImgRef.current, W * 0.15 + playerOffsetRef.current.x, H * 0.45 + playerOffsetRef.current.y, 112, 112);
    }
    if(isFlashingRef.current) { ctx.globalAlpha = 0.6; ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H); ctx.globalAlpha = 1; }
    if(intro.fadeAlpha > 0) { ctx.fillStyle = `rgba(0,0,0,${intro.fadeAlpha})`; ctx.fillRect(0,0,W,H); }
  };

  // Turn Resolution Logic
  const resolveTurn = async (pMoveKey) => {
    if (phase !== BATTLE_PHASES.SELECT) return;
    setPhase(BATTLE_PHASES.RESOLVING);

    const pMove = MOVE_DATA[pMoveKey];
    const eMoves = POKEMON_MOVES[enemyPkmn.id] || ['TACKLE'];
    const eMoveKey = eMoves[Math.floor(Math.random() * eMoves.length)];
    const eMove = MOVE_DATA[eMoveKey];

    const order = determineTurnOrder(pMove, playerPkmn, eMove, enemyPkmn);
    const sequence = order.map(side => ({
      side,
      move: side === 'player' ? pMove : eMove,
      attacker: side === 'player' ? playerPkmn : enemyPkmn,
      defender: side === 'player' ? enemyPkmn : playerPkmn
    }));

    for (const step of sequence) {
      if (playerPkmn.hp <= 0 || enemyPkmn.hp <= 0) break;

      setMessage(`¡${step.attacker.name.toUpperCase()} USÓ ${step.move.nombre}!`);
      activeAnimsRef.current = getMoveAnimation(step.move.id, step.side === 'player', 300, 200);
      
      await new Promise(r => setTimeout(r, 800));

      const result = processMove(step.attacker, step.defender, step.move);
      
      if (result.missed) {
        setMessage("¡Pero falló!");
      } else {
        if (result.damageDealt > 0) {
          isFlashingRef.current = true; setTimeout(() => isFlashingRef.current = false, 100);
          
          const isPlayerDefending = step.side === 'enemy';
          if (isPlayerDefending) {
            setPlayerPkmn(prev => ({ ...prev, hp: Math.max(0, prev.hp - result.damageDealt) }));
          } else {
            setEnemyPkmn(prev => ({ ...prev, hp: Math.max(0, prev.hp - result.damageDealt) }));
          }

          activeAnimsRef.current.push(createAnimation(ANIM_TYPES.TEXT, { 
            text: `-${result.damageDealt}`, 
            x: isPlayerDefending ? 300 * 0.25 : 300 * 0.75, 
            y: isPlayerDefending ? 200 * 0.7 - 20 : 200 * 0.35 - 20, 
            color: '#f00', duration: 800 
          }));

          if (result.isCritical) setMessage("¡Un golpe crítico!");
          if (result.effectiveness > 1) setMessage("¡Es súper efectivo!");
          if (result.effectiveness < 1 && result.effectiveness > 0) setMessage("No es muy efectivo...");
        }

        if (result.effects?.message) {
          await new Promise(r => setTimeout(r, 1000));
          setMessage(result.effects.message);
        }
      }

      await new Promise(r => setTimeout(r, 1500));
    }

    // End turn effects
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
    setMessage(`¡USASTE ${h.nombre.toUpperCase()}!`);
    
    activeAnimsRef.current = [
      createAnimation(ANIM_TYPES.BOUNCE, { target: 'player', duration: 300, amount: 15 }),
      createAnimation(ANIM_TYPES.STRIKE, { x: 300 * 0.75, y: 200 * 0.35, duration: 500, color: '#FFD700' })
    ];

    try {
      const res = await completarHabito(gymId, hId);
      if (res?.leveled_up) setTimeout(() => setMessage("¡SUBISTE DE NIVEL!"), 1000);
    } catch (e) { console.error(e); }

    setTimeout(() => {
      isFlashingRef.current = true; setTimeout(() => isFlashingRef.current = false, 150);
      const total = habitsForStage.length || 1;
      const damageTaken = Math.floor(enemyPkmn.maxHp / total);
      setEnemyPkmn(prev => {
        const nextHp = Math.max(0, prev.hp - damageTaken);
        if (nextHp <= 0) setTimeout(() => endBattle(true), 1500);
        else setTimeout(() => { setPhase(BATTLE_PHASES.SELECT); setMessage(''); }, 1000);
        return { ...prev, hp: nextHp };
      });

      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.TEXT, { text: `-${damageTaken}`, x: 300 * 0.75, y: 200 * 0.35 - 20, color: '#f00', duration: 800 }));
    }, 600);
  };

  const endBattle = async (win) => {
    setPhase(BATTLE_PHASES.FINISHED);
    if (win) {
      if (isWild) {
        setMessage(`¡HAS GANADO LA BATALLA!`);
        await ganarBatalla().catch(e => console.error(e));
      } else {
        setMessage(`¡LÍDER DERROTADO!`);
        await completarGimnasio(gymId, starter.starter_id, starter.starter_nombre).catch(e => console.error(e));
        await ganarBatalla().catch(e => console.error(e));
      }
      setTimeout(() => navigate('city'), 2500);
    } else {
      setMessage(`¡${playerPkmn.name.toUpperCase()} se debilitó!`);
      setTimeout(() => {
        setMessage("Te apresuras al centro de salud...");
        setTimeout(() => navigate('city'), 2000);
      }, 1500);
    }
  };

  if (!playerPkmn || !enemyPkmn) return null;

  return (
    <div style={{ width: '100vw', height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#222', overflow: 'hidden', fontFamily:'"Press Start 2P"' }}>
      <div style={{ width: '100%', maxWidth: '480px', height: '100%', display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
        
        <div style={{flex: '0 0 58%', position:'relative', overflow: 'hidden'}}>
          <canvas ref={battleCanvasRef} width={300} height={200} style={{width:'100%',height:'100%', imageRendering:'pixelated'}} />
          
          {introRef.current.state === INTRO_STATES.READY && (
            <>
              <div style={{ position: 'absolute', top: '16px', left: '8px', transition: 'transform 0.4s', transform: `translateX(${introRef.current.enemyHudX}px)` }}>
                <HPBar current={enemyPkmn.hp} max={enemyPkmn.maxHp} name={enemyPkmn.name} level={enemyPkmn.level} alignment="enemy" />
              </div>
              <div style={{ position: 'absolute', bottom: '16px', right: '8px', transition: 'transform 0.4s', transform: `translateX(${introRef.current.playerHudX - (300-192-8)}px)` }}>
                <HPBar current={playerPkmn.hp} max={playerPkmn.maxHp} name={playerPkmn.name} level={playerPkmn.level} exp={starter.starter_exp} alignment="player" />
              </div>
            </>
          )}
        </div>

        <div style={{ flex: '0 0 42%', background: '#fff', borderTop: '4px solid #333', display: 'flex', flexDirection: 'column', position: 'relative', backgroundImage: `url(${getAssetPath('Graphics/pictures/battle/overlay_message.png')})`, backgroundSize: '100% 100%', imageRendering:'pixelated' }}>
          
          <div style={{ padding: '28px 32px', fontSize: 11, lineHeight: '1.6em', color: '#fff', height: '80px', textShadow:'2px 2px 0 #333' }}>
            {message || (isWild ? '¿QUÉ DEBE HACER TU POKÉMON?' : '¡COMPLETA TUS HÁBITOS!') }
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            {isWild ? (
              menuView === 'main' ? (
                <div style={{ width: '100%', height: '100%', backgroundImage: `url(${getAssetPath('Graphics/pictures/battle/overlay_command.png')})`, backgroundSize: '100% 100%', imageRendering: 'pixelated', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', padding: '10px 10px 20px 50%', gap: '4px' }}>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} className="battle-btn" onClick={() => setMenuView('moves')}>LUCHAR</button>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} className="battle-btn" onClick={() => setMessage("¡No tienes objetos!")}>MOCHILA</button>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} className="battle-btn" onClick={() => setMessage("¡Sólo tienes un PKMN!")}>PKMN</button>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} className="battle-btn" onClick={() => navigate('city')}>HUIR</button>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundImage: `url(${getAssetPath('Graphics/pictures/battle/overlay_fight.png')})`, backgroundSize: '100% 100%', imageRendering: 'pixelated', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', padding: '10px 20px 20px 10px', gap: '4px' }}>
                  {(POKEMON_MOVES[playerPkmn.id] || ['TACKLE']).map(mKey => (
                    <button key={mKey} disabled={phase !== BATTLE_PHASES.SELECT} className="battle-btn" onClick={() => resolveTurn(mKey)}>
                      {MOVE_DATA[mKey]?.nombre || mKey}
                    </button>
                  ))}
                  <button className="battle-btn" style={{ gridColumn: 'span 2', height: '24px' }} onClick={() => setMenuView('main')}>VOLVER</button>
                </div>
              )
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 20px 20px' }}>
                {habitsForStage.map(h => {
                  const done = h.completado || localCompleted[h.habito_id || h.id];
                  return (
                    <button key={h.id} disabled={done || phase !== BATTLE_PHASES.SELECT} className="battle-btn-gym" onClick={() => handleHabitAttack(h)}>
                      <span style={{fontSize: 14}}>{h.icono || '⚔️'}</span>
                      <span style={{fontSize: 6}}>{(h.nombre || '').toUpperCase().substring(0, 10)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <style>{`
          .battle-btn { background: transparent; border: none; font-family: "Press Start 2P"; fontSize: 8px; color: #333; cursor: pointer; display: flex; align-items: center; justify-content: center; }
          .battle-btn:hover { background: rgba(0,0,0,0.1); }
          .battle-btn:disabled { opacity: 0.3; cursor: default; }
          .battle-btn-gym { background: rgba(255,255,255,0.8); border: 2px solid #555; border-radius: 4px; height: 40px; font-family: "Press Start 2P"; cursor: pointer; }
        `}</style>
      </div>
    </div>
  );
};

export default BattleScreen;
