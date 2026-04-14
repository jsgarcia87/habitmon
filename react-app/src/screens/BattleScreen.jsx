import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import HPBar from '../components/HPBar';
import { getAssetPath } from '../api';

const INTRO_STATES = {
  FADE_IN:        'fadeIn',        // 0→1 opacidad
  TRAINER_ENTER:  'trainerEnter',  // entrenador entra
  TRAINER_THROW:  'trainerThrow',  // lanza pokeball
  BALL_FLY:       'ballFly',       // ball en arco
  BALL_FLASH:     'ballFlash',     // flash al abrir
  POKEMON_APPEAR: 'pokemonAppear', // pokemon aparece
  HUD_SLIDE:      'hudSlide',      // HUDs entran
  READY:          'ready'          // combate listo
};

const BattleScreen = ({ navigate, battleData, aPressed }) => {
  const { user, habitosHoy, completarHabito, starter } = useGame();
  
  if (!user || !habitosHoy) {
    return <div className="screen-container">Cargando datos de batalla...</div>;
  }

  const isWild = battleData?.tipo === 'wild' || battleData?.isWild;
  const gymId = battleData?.gymId;
  const wildPk = battleData?.pokemon;
  const enemyName = isWild ? (wildPk?.nombre || 'Wild PKMN') : "LÍDER";
  
  // Data Logic
  const habitsForStage = !isWild ? habitosHoy.filter(h => h.gym_id === gymId) : [];
  const currentPk = starter; // Player's starter for habits template
  
  // State
  const [animating, setAnimating] = useState(true);
  const [localCompleted, setLocalCompleted] = useState({});
  const [leaderHP, setLeaderHP] = useState(100); // We'll initialize properly in an effect
  const [playerHP, setPlayerHP] = useState(100);
  const [message, setMessage] = useState('');
  
  const battleCanvasRef = useRef(null);
  const trainerImgRef = useRef(null);
  const enemyImgRef = useRef(null);
  const bgImgRef = useRef(null);
  
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
    playerHudX: 999
  });

  // Load Assets
  useEffect(() => {
    // Background
    const bg = new Image();
    bg.src = getAssetPath('Graphics/battlebacks/general_bg.png');
    bg.onload = () => { bgImgRef.current = bg; };

    // Trainer
    const avatarNum = String(user?.avatar || 0).padStart(3,'0');
    const tr = new Image();
    tr.src = getAssetPath(`Graphics/trainers/trback${avatarNum === '000' ? '000' : '001'}.png`);
    tr.onload = () => { trainerImgRef.current = tr; };
    tr.onerror = () => {
      const tr2 = new Image();
      tr2.src = getAssetPath('Graphics/trainers/trback000.png');
      tr2.onload = () => { trainerImgRef.current = tr2; };
    };

    // Enemy
    const enemyFormattedId = String(isWild ? wildPk?.id : 151).padStart(3, '0');
    const en = new Image();
    en.src = getAssetPath(`Graphics/battlers/${enemyFormattedId}.png`);
    en.onload = () => { enemyImgRef.current = en; };

    // Initialize HP
    const initialCompleted = habitsForStage.filter(h => h.completado).length;
    const total = habitsForStage.length || 1;
    setLeaderHP(isWild ? 100 : 100 - (initialCompleted / total * 100));
    
  }, [user, isWild, wildPk, habitsForStage, gymId]);

  // Game Loop Logic
  const updateIntro = (dt) => {
    const intro = introRef.current;
    const W = battleCanvasRef.current?.width || 300;
    const H = battleCanvasRef.current?.height || 200;
    
    intro.timer += dt;

    switch(intro.state) {
      case INTRO_STATES.FADE_IN:
        intro.fadeAlpha = Math.max(0, 1 - intro.timer / 400);
        if(intro.timer > 400) {
          intro.state = INTRO_STATES.TRAINER_ENTER;
          intro.timer = 0;
        }
        break;

      case INTRO_STATES.TRAINER_ENTER:
        intro.trainerX = Math.min(W * 0.22, -80 + (intro.timer / 600) * (W * 0.22 + 80));
        if(intro.timer > 600) {
          intro.state = INTRO_STATES.TRAINER_THROW;
          intro.timer = 0;
        }
        break;

      case INTRO_STATES.TRAINER_THROW:
        if(intro.timer > 400) {
          intro.ballVisible = true;
          intro.ballX = intro.trainerX + 40;
          intro.ballY = H * 0.65;
          intro.state = INTRO_STATES.BALL_FLY;
          intro.timer = 0;
        }
        break;

      case INTRO_STATES.BALL_FLY:
        const t = Math.min(1, intro.timer / 500);
        const startX = intro.trainerX + 40;
        const endX = W * 0.72;
        const startY = H * 0.65;
        const endY = H * 0.44;
        intro.ballX = startX + (endX - startX) * t;
        intro.ballY = startY + (endY - startY) * t - Math.sin(t * Math.PI) * H * 0.3;
        intro.ballAngle += 0.25;
        if(intro.timer > 500) {
          intro.ballVisible = false;
          intro.state = INTRO_STATES.BALL_FLASH;
          intro.timer = 0;
        }
        break;

      case INTRO_STATES.BALL_FLASH:
        intro.flashAlpha = Math.max(0, 1 - intro.timer / 300);
        intro.enemyOpacity = Math.min(1, intro.timer / 300);
        intro.enemyScale = Math.min(1, 0.1 + (intro.timer / 300) * 0.9);
        if(intro.timer > 300) {
          intro.state = INTRO_STATES.POKEMON_APPEAR;
          intro.timer = 0;
          intro.enemyScale = 1;
          intro.enemyOpacity = 1;
        }
        break;

      case INTRO_STATES.POKEMON_APPEAR:
        if(intro.timer > 200) {
          setMessage(`¡${enemyName.toUpperCase()} apareció!`);
          intro.state = INTRO_STATES.HUD_SLIDE;
          intro.timer = 0;
        }
        break;

      case INTRO_STATES.HUD_SLIDE:
        intro.enemyHudX = Math.min(8, -200 + (intro.timer / 300) * 208);
        intro.playerHudX = Math.max(W - 158, W + 10 - (intro.timer / 300) * 168);
        if(intro.timer > 300) {
          intro.state = INTRO_STATES.READY;
          setAnimating(false);
        }
        break;
      default: break;
    }
  };

  const drawPokeball = (ctx, x, y, r, angle) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#E8190C';
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, r*0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const drawIntro = (ctx, W, H) => {
    const intro = introRef.current;
    
    // Background
    if(bgImgRef.current) {
      ctx.drawImage(bgImgRef.current, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#F8F0D8';
      ctx.fillRect(0, 0, W, H);
    }

    // Trainer
    if(trainerImgRef.current && intro.state !== INTRO_STATES.FADE_IN) {
      const img = trainerImgRef.current;
      const tw = 64, th = 80;
      ctx.drawImage(img, 0, 0, img.width, img.height, intro.trainerX, H*0.55, tw, th);
    }

    // Pokeball
    if(intro.ballVisible) {
      drawPokeball(ctx, intro.ballX, intro.ballY, 10, intro.ballAngle);
    }

    // Enemy
    if(enemyImgRef.current && intro.enemyOpacity > 0) {
      const img = enemyImgRef.current;
      ctx.globalAlpha = intro.enemyOpacity;
      ctx.save();
      ctx.translate(W * 0.72, H * 0.35);
      ctx.scale(intro.enemyScale, intro.enemyScale);
      ctx.drawImage(img, -48, -48, 96, 96);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // Flash
    if(intro.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${intro.flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Fade initial
    if(intro.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${intro.fadeAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }
  };

  useEffect(() => {
    let frameId;
    let lastTime = 0;

    const loop = (time) => {
      if(!lastTime) lastTime = time;
      const dt = time - lastTime;
      lastTime = time;

      const canvas = battleCanvasRef.current;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;

      updateIntro(dt);
      drawIntro(ctx, W, H);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleAttack = async (habit) => {
    if (animating) return;
    setAnimating(true);
    
    const habitId = habit.habito_id || habit.id;
    setMessage(`¡${user.username} lanzó ${habit.nombre.toUpperCase()}!`);
    
    // API Call
    await completarHabito(gymId, habitId);
    
    // Local animation simulation
    setTimeout(() => {
      const dmg = 100 / (habitsForStage.length || 1);
      const newHP = Math.max(0, leaderHP - dmg);
      setLeaderHP(newHP);
      setLocalCompleted(prev => ({...prev, [habitId]: true}));

      if (newHP <= 0) {
        setMessage(`¡El ${enemyName} se debilitó!`);
        setTimeout(() => navigate(isWild ? 'capture' : 'city', { gymId }), 2000);
      } else {
        setMessage("¡Es muy eficaz!");
        setTimeout(() => {
          setAnimating(false);
          setMessage('');
        }, 1500);
      }
    }, 1000);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#000',
      fontFamily: '"Press Start 2P", monospace'
    }}>
      {/* Arena — 58% */}
      <div style={{flex: '0 0 58%', position:'relative', overflow: 'hidden'}}>
        <canvas 
          ref={battleCanvasRef}
          width={300}
          height={200}
          style={{width:'100%',height:'100%', imageRendering:'pixelated', display:'block'}}
        />
        
        {/* HUD Overlay (Optional but recommended for gameplay) */}
        {introRef.current.state === INTRO_STATES.READY && (
          <>
            <div style={{
              position: 'absolute', 
              top: '20px', 
              left: '10px', 
              transition: 'transform 0.3s',
              transform: `translateX(${introRef.current.enemyHudX}px)`
            }}>
              <HPBar current={leaderHP} max={100} name={enemyName} level={isWild ? 5 : 30} alignment="enemy" />
            </div>
            <div style={{
              position: 'absolute', 
              bottom: '20px', 
              right: '10px',
              transition: 'transform 0.3s',
              transform: `translateX(${introRef.current.playerHudX - (battleCanvasRef.current?.width || 300) + 158}px)`
            }}>
              <HPBar current={playerHP} max={100} name={user.starter_nombre || 'PKMN'} level={user.starter_nivel || 5} alignment="player" />
            </div>
          </>
        )}
      </div>

      {/* UI inferior — 42% */}
      <div style={{
        flex: '0 0 42%',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderTop: '4px solid #111'
      }}>
        {/* Caja mensaje */}
        <div style={{
          padding: '10px 14px',
          fontSize: 9,
          lineHeight: '1.8em',
          borderBottom: '3px solid #111',
          minHeight: 52,
          color: '#111',
          position: 'relative'
        }}>
          {message}
          {message && (
            <span style={{
              position:'absolute',right:10,bottom:6,
              animation:'blink 0.6s steps(1) infinite'
            }}>▼</span>
          )}
        </div>

        {/* Grid ataques 2x2 — ocupa el resto */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 3,
          padding: 6,
          background: '#c8c8c8'
        }}>
          {habitsForStage.map(h => {
            const hId = h.habito_id || h.id;
            const tpl = currentPk?.habitos?.find(
              t => t.id === hId
            );
            const done = h.completado || localCompleted[hId];
            return (
              <button key={hId}
                disabled={done || animating}
                onClick={() => handleAttack(h)}
                style={{
                  background: done ? '#888':'#f0f0f0',
                  border: '3px solid #333',
                  padding: '6px 4px',
                  fontFamily:'"Press Start 2P",monospace',
                  fontSize: 6,
                  color: '#111',
                  cursor: done||animating ?'default':'pointer',
                  textDecoration: done?'line-through':'none',
                  display:'flex',
                  flexDirection:'column',
                  alignItems:'center',
                  justifyContent:'center',
                  gap: 3,
                  opacity: done ? 0.5 : 1
                }}
              >
                <span style={{fontSize:18}}>
                  {tpl?.icono || '⚔️'}
                </span>
                <span>{(h.nombre||tpl?.nombre||'')
                  .toUpperCase().substring(0,12)}</span>
                <span style={{fontSize:5,color:'#555'}}>
                  DMG {tpl?.daño || '?'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default BattleScreen;
