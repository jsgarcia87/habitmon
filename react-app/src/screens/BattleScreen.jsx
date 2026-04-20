import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import HPBar from '../components/HPBar';
import { getAssetPath } from '../api/assets';
import { safeDrawImage } from '../utils/gfxUtils';
import { MOVE_DATA, POKEMON_MOVES } from '../data/moveData';

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
  ANIMATING: 'animating',
  ENEMY_ACTION: 'enemyAction',
  FINISHED: 'finished'
};

const BattleScreen = ({ navigate, battleData, aPressed }) => {
  const { user, habitosHoy, completarHabito, starter, capturarPokemon, completarGimnasio } = useGame();
  
  if (!user || !habitosHoy) {
    return <div style={{width:'100vw', height:'100dvh', background:'#000', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Press Start 2P"'}}>Cargando combate...</div>;
  }

  const isWild = battleData?.tipo === 'wild' || battleData?.isWild || battleData?.type === 'encounter';
  const gymId = battleData?.gymId;
  const wildPk = battleData?.pokemon || { id: 16, nombre: 'PIDGEY', nivel: 5 };
  const enemyName = isWild ? (wildPk?.nombre || 'Wild PKMN') : "LÍDER";
  
  const normalizedGymId = String(gymId || '').trim().toLowerCase();
  const habitsForStage = !isWild ? habitosHoy.filter(h => String(h.gym_id || '').trim().toLowerCase() === normalizedGymId) : [];
  
  const [phase, setPhase] = useState(BATTLE_PHASES.SELECT);
  const [menuView, setMenuView] = useState('main'); // 'main' or 'moves'
  const [animating, setAnimating] = useState(true);
  const [localCompleted, setLocalCompleted] = useState({});
  const [leaderHP, setLeaderHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(100);
  const [message, setMessage] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  
  const battleCanvasRef = useRef(null);
  const trainerImgRef = useRef(null);
  const enemyImgRef = useRef(null);
  const bgImgRef = useRef(null);
  const playerPkImgRef = useRef(null);
  
  const introRef = useRef({
    state: INTRO_STATES.FADE_IN,
    timer: 0,
    fadeAlpha: 1,
    trainerX: -80,
    ballVisible: false,
    ballX: 0, ballY: 0,
    ballAngle: 0,
    enemyOpacity: 0,
    enemyScale: 0.1,
    enemyOffsetX: 0,
    flashAlpha: 0,
    enemyHudX: -200,
    playerHudX: 430
  });

  useEffect(() => {
    const bg = new Image();
    bg.src = getAssetPath('Graphics/battlebacks/general_bg.png');
    bg.onload = () => { bgImgRef.current = bg; };

    const avatarNum = String(user?.avatar || 0).padStart(3,'0');
    const tr = new Image();
    tr.src = getAssetPath(`Graphics/trainers/trback${avatarNum === '000' ? '000' : '001'}.png`);
    tr.onload = () => { trainerImgRef.current = tr; };

    const enemyFormattedId = String(isWild ? wildPk?.id : 151).padStart(3, '0');
    const en = new Image();
    en.src = getAssetPath(`Graphics/battlers/${enemyFormattedId}.png`);
    en.onload = () => { enemyImgRef.current = en; };

    const pPk = new Image();
    const starterId = String(user?.starter_id || 152).padStart(3, '0');
    pPk.src = getAssetPath(`Graphics/battlers/${starterId}b.png`);
    pPk.onload = () => { playerPkImgRef.current = pPk; };

    if (!isWild) {
      const initialCompleted = habitsForStage.filter(h => h.completado).length;
      const total = habitsForStage.length || 1;
      setLeaderHP(100 - (initialCompleted / total * 100));
    }
  }, [user, isWild, wildPk, habitsForStage, gymId]);

  useEffect(() => {
    let lastTime = performance.now();
    let frameId;
    const loop = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      if (battleCanvasRef.current) {
        const ctx = battleCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, 300, 200);
        updateIntro(dt);
        drawIntro(ctx, 300, 200);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [enemyName]);

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
        if(intro.timer > 400) { 
          intro.ballVisible = true; intro.ballX = intro.trainerX + 40; intro.ballY = 200 * 0.65;
          intro.state = INTRO_STATES.BALL_FLY; intro.timer = 0; 
        }
        break;
      case INTRO_STATES.BALL_FLY:
        const t = Math.min(1, intro.timer / 500);
        intro.ballX = (intro.trainerX + 40) + (300 * 0.72 - (intro.trainerX + 40)) * t;
        intro.ballY = (200 * 0.65) + (200 * 0.44 - (200 * 0.65)) * t - Math.sin(t * Math.PI) * 200 * 0.3;
        intro.ballAngle += 0.25;
        if(intro.timer > 500) { intro.ballVisible = false; intro.state = INTRO_STATES.BALL_FLASH; intro.timer = 0; }
        break;
      case INTRO_STATES.BALL_FLASH:
        intro.flashAlpha = Math.max(0, 1 - intro.timer / 300);
        intro.enemyOpacity = Math.min(1, intro.timer / 300);
        intro.enemyScale = Math.min(1, 0.1 + (intro.timer / 300) * 0.9);
        if(intro.timer > 300) { intro.state = INTRO_STATES.POKEMON_APPEAR; intro.timer = 0; }
        break;
      case INTRO_STATES.POKEMON_APPEAR:
        if(intro.timer > 200) { setMessage(`¡${enemyName.toUpperCase()} SALVAJE APARECIÓ!`); intro.state = INTRO_STATES.HUD_SLIDE; intro.timer = 0; }
        break;
      case INTRO_STATES.HUD_SLIDE:
        intro.enemyHudX = Math.min(8, -200 + (intro.timer/300) * 208);
        intro.playerHudX = Math.max(300-192-8, 430 - (intro.timer / 300) * 330);
        if(intro.timer > 300) { intro.state = INTRO_STATES.READY; setAnimating(false); }
        break;
      default: break;
    }
  };

  const drawIntro = (ctx, W, H) => {
    const intro = introRef.current;
    if(bgImgRef.current) safeDrawImage(ctx, bgImgRef.current, 0, 0, W, H);
    if(intro.state !== INTRO_STATES.READY && trainerImgRef.current) {
        const img = trainerImgRef.current;
        safeDrawImage(ctx, img, 0, 0, img.width/5, img.height, intro.trainerX, H*0.55, 64, 80);
    }
    if(intro.enemyOpacity > 0 && enemyImgRef.current) {
      ctx.globalAlpha = intro.enemyOpacity; ctx.save(); ctx.translate(W * 0.72, H * 0.35); ctx.scale(intro.enemyScale, intro.enemyScale);
      safeDrawImage(ctx, enemyImgRef.current, -48, -48, 96, 96); ctx.restore(); ctx.globalAlpha = 1;
    }
    if(intro.state === INTRO_STATES.READY && playerPkImgRef.current) {
      safeDrawImage(ctx, playerPkImgRef.current, W * 0.1, H * 0.45, 96, 96);
    }
    if(isFlashing) { ctx.globalAlpha = 0.6; ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H); ctx.globalAlpha = 1; }
    if(intro.fadeAlpha > 0) { ctx.fillStyle = `rgba(0,0,0,${intro.fadeAlpha})`; ctx.fillRect(0,0,W,H); }
  };

  const handleRun = () => {
    setMessage('¡Escapaste sin problemas!');
    setPhase(BATTLE_PHASES.FINISHED);
    setTimeout(() => navigate('city'), 1500);
  };

  const handleCapture = async () => {
    if (phase !== BATTLE_PHASES.SELECT) return;
    setPhase(BATTLE_PHASES.ANIMATING);
    setMessage(`¡Has lanzado una POKÉ BALL!`);
    
    // Simple logic: higher success if low HP
    const success = Math.random() < (1.2 - (leaderHP / 100));
    
    setTimeout(async () => {
      if (success) {
        setMessage(`¡Ya está! ¡${wildPk.nombre} atrapado!`);
        await capturarPokemon(wildPk.id, wildPk.nombre);
        setTimeout(() => navigate('city'), 2000);
      } else {
        setMessage(`¡Oh, no! ¡El POKÉMON se ha escapado!`);
        setTimeout(() => {
          setPhase(BATTLE_PHASES.SELECT);
          setMessage('¿Qué quieres hacer?');
        }, 1500);
      }
    }, 1500);
  };

  const handleMoveSelection = async (moveKey) => {
    if (phase !== BATTLE_PHASES.SELECT || animating) return;
    const move = MOVE_DATA[moveKey];
    setPhase(BATTLE_PHASES.ANIMATING);
    setMessage(`¡${starter.starter_nombre.toUpperCase()} USÓ ${move.nombre}!`);
    
    setTimeout(() => {
      setIsFlashing(true); setTimeout(() => setIsFlashing(false), 100);
      const dmg = Math.floor(move.power * (starter.starter_nivel / 5));
      const newLeaderHP = Math.max(0, leaderHP - (dmg / 2));
      setLeaderHP(newLeaderHP);

      if (newLeaderHP <= 0) {
        setMessage(`¡${enemyName.toUpperCase()} SE DEBILITÓ!`);
        setPhase(BATTLE_PHASES.FINISHED);
        ganarBatalla().then(res => {
           if (res?.leveled_up) setMessage("¡TU POKÉMON SUBIÓ DE NIVEL!");
        });
        setTimeout(() => navigate('city'), 2500);
      } else {
        setTimeout(() => {
          setPhase(BATTLE_PHASES.ENEMY_ACTION);
          setMessage(`¡${enemyName.toUpperCase()} RESPONDIÓ!`);
          setTimeout(() => {
            setIsFlashing(true); setTimeout(() => setIsFlashing(false), 100);
            setPlayerHP(prev => Math.max(0, prev - 10));
            setTimeout(() => { setPhase(BATTLE_PHASES.SELECT); setMessage(''); }, 1000);
          }, 1000);
        }, 1500);
      }
    }, 1000);
  };

  const handleHabitAttack = async (h) => {
    if (animating || localCompleted[h.habito_id || h.id]) return;
    setAnimating(true); setIsFlashing(true); setTimeout(() => setIsFlashing(false), 150);
    const hId = h.habito_id || h.id;
    setLocalCompleted(prev => ({...prev, [hId]: true}));
    
    setMessage(`¡USASTE ${h.nombre.toUpperCase()}!`);
    const res = await completarHabito(gymId, hId).catch(e => console.error(e));
    
    if (res?.leveled_up) {
      setTimeout(() => setMessage("¡TU POKÉMON SUBIÓ DE NIVEL!"), 1600);
    }

    setTimeout(() => {
      const doneSoFar = Object.keys(localCompleted).length + 1;
      const total = habitsForStage.length;
      const newHP = 100 - Math.min(100, Math.round((doneSoFar / total) * 100));
      setLeaderHP(newHP);

      if (newHP <= 0) {
        setMessage(`¡LÍDER DERROTADO! ¡GANASTE MEDALLA!`);
        completarGimnasio(gymId, starter?.pokemon_id, starter?.pokemon_nombre).catch(e => console.error(e));
        setTimeout(() => navigate('city'), 2000);
      } else {
        setTimeout(() => { setAnimating(false); setMessage(''); }, 800);
      }
    }, 800);
  };

  const modernButtonStyle = {
    background: '#f8f8f8', border: '2px solid #555', borderRadius: '4px',
    fontFamily: '"Press Start 2P"', fontSize: 8, color: '#333', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.1), 2px 2px 0 rgba(0,0,0,0.2)'
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#222', overflow: 'hidden', fontFamily:'"Press Start 2P"' }}>
      <div style={{ width: '100%', maxWidth: '480px', height: '100%', display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
        
        <div style={{flex: '0 0 58%', position:'relative', overflow: 'hidden'}}>
          <canvas ref={battleCanvasRef} width={300} height={200} style={{width:'100%',height:'100%', imageRendering:'pixelated'}} />
          
          {introRef.current.state === INTRO_STATES.READY && (
            <>
              <div style={{ position: 'absolute', top: '16px', left: '8px', transition: 'transform 0.4s', transform: `translateX(${introRef.current.enemyHudX}px)` }}>
                <HPBar current={leaderHP} max={100} name={enemyName} level={isWild ? wildPk.nivel : 30} alignment="enemy" />
              </div>
              <div style={{ position: 'absolute', bottom: '16px', right: '8px', transition: 'transform 0.4s', transform: `translateX(${introRef.current.playerHudX - (300-192-8)}px)` }}>
                <HPBar current={playerHP} max={100} name={starter.starter_nombre} level={starter.starter_nivel} exp={starter.xp} alignment="player" />
              </div>
            </>
          )}
        </div>

        <div style={{ flex: '0 0 42%', background: '#fff', borderTop: '4px solid #333', display: 'flex', flexDirection: 'column', position: 'relative', backgroundImage: `url(${getAssetPath('Graphics/pictures/battle/overlay_message.png')})`, backgroundSize: '100% 100%', imageRendering:'pixelated' }}>
          
          <div style={{ padding: '28px 32px', fontSize: 11, lineHeight: '1.6em', color: '#fff', height: '80px', textShadow:'2px 2px 0 #333' }}>
            {message || (isWild ? '¿QUÉ DEBE HACER TU POKÉMON?' : '¡COMPLETA TUS HÁBITOS!') }
          </div>

          <div style={{ flex: 1, padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8 }}>
            {isWild ? (
              menuView === 'main' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={() => setMenuView('moves')}>💪 LUCHAR</button>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={handleCapture}>🎒 MOCHILA</button>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={() => setMessage("¡Sólo tienes un PKMN!")}>🐢 PKMN</button>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={handleRun}>🏃 HUIR</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                  {(POKEMON_MOVES[starter?.pokemon_id || 1] || ['TACKLE']).map(mKey => (
                    <button key={mKey} disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={() => handleMoveSelection(mKey)}>
                      {MOVE_DATA[mKey]?.nombre || mKey}
                    </button>
                  ))}
                  <button style={{ ...modernButtonStyle, background: '#666' }} onClick={() => setMenuView('main')}>VOLVER</button>
                </div>
              )
            ) : (
              habitsForStage.map(h => {
                const done = h.completado || localCompleted[h.habito_id || h.id];
                return (
                  <button key={h.habito_id || h.id} disabled={done || animating} style={{ ...modernButtonStyle, opacity: done ? 0.5 : 1 }} onClick={() => handleHabitAttack(h)}>
                    <span style={{fontSize: 16}}>{h.icono || '⚔️'}</span>
                    <span style={{fontSize: 7}}>{(h.nombre || '').toUpperCase().substring(0, 10)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleScreen;
