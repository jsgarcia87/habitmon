import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import HPBar from '../components/HPBar';
import { getAssetPath } from '../api/assets';
import { safeDrawImage } from '../utils/gfxUtils';
import { MOVE_DATA, POKEMON_MOVES } from '../data/moveData';

const INTRO_STATES = {
  TRANSITION:     'transition',
  ENEMY_ENTER:    'enemyEnter',
  TRAINER_ENTER:  'trainerEnter',
  TRAINER_THROW:  'trainerThrow',
  BALL_FLY:       'ballFly',
  BALL_FLASH:     'ballFlash',
  POKEMON_APPEAR: 'pokemonAppear',
  TRAINER_EXIT:   'trainerExit',
  HUD_SLIDE:      'hudSlide',
  READY:          'ready'
};

// TYPE CHART (Simplified for Essentials implementation)
const TYPE_CHART = {
  FIRE:   { GRASS: 2, WATER: 0.5, FIRE: 0.5, ICE: 2 },
  WATER:  { FIRE: 2, GRASS: 0.5, WATER: 0.5, GROUND: 2 },
  GRASS:  { WATER: 2, FIRE: 0.5, GRASS: 0.5, GROUND: 2, POISON: 0.5, FLYING: 0.5 },
  ELECTRIC: { WATER: 2, GRASS: 0.5, ELECTRIC: 0.5, FLYING: 2, GROUND: 0 },
  FLYING: { GRASS: 2, ELECTRIC: 0.5, FIGHTING: 2, BUG: 2 },
  NORMAL: { ROCK: 0.5, GHOST: 0 },
};

const getEffectiveness = (moveType, targetType) => {
  if (!moveType || !targetType) return 1;
  return TYPE_CHART[moveType]?.[targetType] ?? 1;
};

const calculateDamage = (attacker, defender, move, isPlayer) => {
  if (move.power === 0) return 0; // Status move
  const level = isPlayer ? attacker.starter_nivel : (attacker.nivel || 5);
  const atk = move.category === 'Special' ? 50 : 50; 
  const def = move.category === 'Special' ? 50 : 50;
  const effectiveness = getEffectiveness(move.type, defender.tipo || 'NORMAL');
  const stab = 1.0;
  const random = Math.random() * 0.15 + 0.85; 
  const baseDamage = ((((2 * level / 5 + 2) * atk * move.power / def) / 50) + 2);
  return Math.floor(baseDamage * effectiveness * stab * random);
};

const BATTLE_PHASES = {
  SELECT: 'select',
  ANIMATING: 'animating',
  ENEMY_ACTION: 'enemyAction',
  FINISHED: 'finished'
};

const ANIM_STATES = {
  NONE: 'none',
  SLIDE_FORWARD: 'slideForward',
  VFX: 'vfx',
  SHAKE: 'shake',
  SLIDE_BACK: 'slideBack',
  FAINT: 'faint'
};

const BattleScreen = ({ navigate, battleData, aPressed }) => {
  const { user, habitosHoy, completarHabito, starter, capturarPokemon, completarGimnasio, ganarBatalla } = useGame();
  
  const [showForceStart, setShowForceStart] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowForceStart(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!user || !habitosHoy || !starter) {
    return (
      <div style={{
        width:'100vw', height:'100dvh', background:'#000', color:'#fff', 
        display:'flex', flexDirection: 'column', alignItems:'center', justifyContent:'center', 
        fontFamily:'"Press Start 2P"', gap: 20, textAlign: 'center', padding: 20
      }}>
        <div style={{fontSize: 10, color: '#FFD700'}}>SINCRONIZANDO DATOS...</div>
        <div style={{fontSize: 7, color: '#666', lineHeight: '1.5'}}>
          {!user && "Esperando usuario... "}
          {(!starter && user?.starter_id) ? "Recuperando equipo... " : (!starter && "Cargando equipo... ")}
          {(!habitosHoy || habitosHoy.length === 0) && "Buscando hábitos..."}
        </div>
        
        {showForceStart && (
          <div style={{marginTop: 20, display:'flex', flexDirection:'column', gap: 15, alignItems:'center'}}>
            <p style={{fontSize: 6, color: '#E83030'}}>La conexión está tardando más de lo normal.</p>
            <button 
              onClick={() => {
                window.location.reload();
              }}
              style={{padding: '10px', background: '#E83030', color: '#fff', border: '2px solid #fff', fontFamily: '"Press Start 2P"', fontSize: 8, cursor: 'pointer', marginTop: 10}}
            >
              REINTENTAR CARGA
            </button>
            <button 
              onClick={() => navigate('city')}
              style={{padding: '10px', background: '#333', color: '#fff', border: '2px solid #fff', fontFamily: '"Press Start 2P"', fontSize: 8, cursor: 'pointer'}}
            >
              SALIR A LA CIUDAD
            </button>
          </div>
        )}
      </div>
    );
  }

  const [currentPhase, setCurrentPhase] = useState(0);
  const [phase, setPhase] = useState(BATTLE_PHASES.SELECT);
  const [menuView, setMenuView] = useState('main'); 
  const [animating, setAnimating] = useState(true);
  const [localCompleted, setLocalCompleted] = useState({});
  const [leaderHP, setLeaderHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(100);
  const [message, setMessage] = useState('');

  const isWild = battleData?.tipo === 'wild' || battleData?.isWild || battleData?.type === 'encounter';
  const gymId = battleData?.gymId;
  const wildPk = battleData?.pokemon || { id: 16, nombre: 'PIDGEY', nivel: 5 };
  const normalizedGymId = String(gymId || '').trim().toLowerCase();
  const isVestirse = normalizedGymId === 'vestirse';
  
  const enemyName = isWild ? (wildPk?.nombre || 'Wild PKMN') : (
    isVestirse ? (currentPhase === 0 ? 'QUITAR ROPA' : 'PONER ROPA') : "LÍDER"
  );
  
  const allGymHabits = !isWild ? habitosHoy.filter(h => String(h.gym_id || '').trim().toLowerCase() === normalizedGymId) : [];
  const habitsForStage = !isWild ? allGymHabits.filter(h => (h.orden || 0) === currentPhase) : [];

  
  const battleCanvasRef = useRef(null);
  const trainerImgRef = useRef(null);
  const enemyImgRef = useRef(null);
  const bgImgRef = useRef(null);
  const playerPkImgRef = useRef(null);
  
  const introRef = useRef({
    state: INTRO_STATES.TRANSITION,
    timer: 0,
    fadeAlpha: 1,
    enemyX: 400,
    enemyOpacity: 0,
    trainerX: -150,
    trainerFrame: 0,
    ballVisible: false,
    ballX: 0, ballY: 0,
    ballAngle: 0,
    burstRadius: 0,
    flashAlpha: 0,
    fadeAlpha: 1,
    enemyHudX: -240,
    playerHudX: 450,
    playerOffX: 0, playerOffY: 0,
    enemyOffX: 0, enemyOffY: 0,
    shakeX: 0, shakeY: 0,
    enemyVisible: true,
    playerVisible: true,
    vfxType: null,
    vfxTimer: 0,
    vfxData: null,
    particles: [],
    playerScale: 1,
    enemyScale: 1,
    playerFainting: false,
    enemyFainting: false,
    playerFaintY: 0,
    enemyFaintY: 0,
    transitionProgress: 0,
    bars: 10,
    bgScrollX: 0,
    bgScrollY: 0
  });

  useEffect(() => {
    const bg = new Image();
    bg.src = getAssetPath('Graphics/battlebacks/general_bg.png');
    bg.onload = () => { bgImgRef.current = bg; };

    const avatarNum = String(user?.avatar || 0).padStart(3,'0');
    const pPk = new Image();
    const starterId = String(user?.starter_id || 152).padStart(3, '0');
    pPk.src = getAssetPath(`Graphics/battlers/${starterId}b.png`);
    pPk.onload = () => { playerPkImgRef.current = pPk; };

    const tr = new Image();
    // Fallback logic for back sprites
    const availableBacks = ['000', '001', '044'];
    const backId = availableBacks.includes(avatarNum) ? avatarNum : '000';
    tr.src = getAssetPath(`Graphics/trainers/trback${backId}.png`);
    tr.onload = () => { trainerImgRef.current = tr; };

    const isVestirse = normalizedGymId === 'vestirse';
    const enemyInfo = isWild ? { id: wildPk?.id, nombre: wildPk?.nombre } : (
      isVestirse ? (currentPhase === 0 ? { id: '052', nombre: 'QUITAR ROPA' } : { id: '053', nombre: 'PONER ROPA' }) : { id: '151', nombre: 'LÍDER' }
    );
    const enemyFormattedId = String(enemyInfo.id).padStart(3, '0');
    const en = new Image();
    en.src = getAssetPath(`Graphics/battlers/${enemyFormattedId}.png`);
    en.onload = () => { enemyImgRef.current = en; };

    // Update enemy name display if it's a gym
    if (!isWild) {
       // We can use enemyInfo.nombre here or just keep the state updated
    }

    if (!isWild) {
      const initialCompleted = habitsForStage.filter(h => h.completado).length;
      const total = habitsForStage.length || 1;
      setLeaderHP(100 - (initialCompleted / total * 100));
    }
  }, [user, isWild, wildPk, habitsForStage, gymId, currentPhase]);

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
        drawBattle(ctx, 300, 200);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [enemyName]);

  const updateIntro = (dt) => {
    const intro = introRef.current;
    
    const W = 300;
    const H = 200;
    intro.timer += dt;
    
    // Background dynamic movement (constant)
    intro.bgScrollX = Math.sin(intro.timer / 2000) * 10;
    intro.bgScrollY = Math.cos(intro.timer / 3000) * 5;

    if (intro.state === INTRO_STATES.READY) {
      // Particles update even when ready
      if (intro.particles.length > 0) {
        intro.particles.forEach(p => {
          p.x += p.vx * (dt / 16);
          p.y += p.vy * (dt / 16);
          p.vy += 0.2 * (dt / 16); // gravity
          p.life -= dt;
        });
        intro.particles = intro.particles.filter(p => p.life > 0);
      }
      return;
    }

    switch(intro.state) {
      case INTRO_STATES.TRANSITION:
        intro.transitionProgress = Math.min(1, intro.timer / 1200);
        if(intro.timer > 1200) { 
          intro.state = INTRO_STATES.ENEMY_ENTER; 
          intro.timer = 0; 
          intro.flashAlpha = 0.5; // Flash when transition ends
          if(isWild) setMessage(`¡UN ${enemyName.toUpperCase()} SALVAJE APARECIÓ!`);
          else setMessage(`¡LÍDER ${enemyName.toUpperCase()} TE DESAFÍA!`);
        }
        break;
      case INTRO_STATES.ENEMY_ENTER:
        // Snap in faster
        intro.enemyX = Math.max(W * 0.72, 400 - (intro.timer / 500) * (400 - W * 0.72));
        intro.enemyOpacity = 1;
        if(intro.timer > 800) { // Slight delay before trainer
          intro.state = INTRO_STATES.TRAINER_ENTER; 
          intro.timer = 0; 
          // Subtle shake when enemy "lands"
          intro.shakeX = 5; 
          setTimeout(() => { if(introRef.current) introRef.current.shakeX = 0; }, 100);
        }
        break;
      case INTRO_STATES.TRAINER_ENTER:
        // Enter from left with easeOut
        const et = Math.min(1, intro.timer / 600);
        intro.trainerX = -120 + (et * (2 - et)) * (W * 0.08 + 120);
        if(intro.timer > 700) { intro.state = INTRO_STATES.TRAINER_THROW; intro.timer = 0; }
        break;
      case INTRO_STATES.TRAINER_THROW:
        // Animate the throw frames (0, 1, 2, 3, 4)
        intro.trainerFrame = Math.floor(intro.timer / 100);
        if(intro.timer > 500) { 
          intro.ballVisible = true; 
          intro.ballX = intro.trainerX + 40; 
          intro.ballY = H * 0.6;
          intro.state = INTRO_STATES.BALL_FLY; 
          intro.timer = 0; 
          setMessage(`¡ADELANTE, ${starter.starter_nombre.toUpperCase()}!`);
        }
        break;
      case INTRO_STATES.BALL_FLY:
        const t = Math.min(1, intro.timer / 600);
        const startX = (W * 0.08) + 40;
        const startY = H * 0.6;
        const endX = W * 0.22;
        const endY = H * 0.75;
        intro.ballX = startX + (endX - startX) * t;
        intro.ballY = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 60;
        intro.ballAngle += 0.5;
        if(intro.timer > 600) { 
          intro.state = INTRO_STATES.BALL_FLASH; 
          intro.timer = 0; 
          intro.ballVisible = false; 
          intro.burstRadius = 5;
          intro.flashAlpha = 0.9;
        }
        break;
      case INTRO_STATES.BALL_FLASH:
        intro.burstRadius += dt * 0.3;
        intro.flashAlpha = Math.max(0, intro.flashAlpha - dt * 0.004);
        if(intro.timer > 200) { 
          intro.state = INTRO_STATES.POKEMON_APPEAR; 
          intro.timer = 0; 
          // Create GSC-style burst particles
          intro.particles = [...intro.particles, ...createBurstParticles(W * 0.2, H * 0.65)];
        }
        break;
      case INTRO_STATES.POKEMON_APPEAR:
        intro.burstRadius = Math.max(0, intro.burstRadius - dt * 0.15);
        if(intro.timer > 500) { intro.state = INTRO_STATES.TRAINER_EXIT; intro.timer = 0; }
        break;
      case INTRO_STATES.TRAINER_EXIT:
        // Smooth slide out from current position
        intro.trainerX = (W * 0.1) - (intro.timer / 400) * 200;
        if(intro.timer > 400) { intro.state = INTRO_STATES.HUD_SLIDE; intro.timer = 0; }
        break;
      case INTRO_STATES.HUD_SLIDE:
        // Slide in HUD from off-screen
        intro.enemyHudX = Math.min(8, -240 + (intro.timer/400) * 248);
        intro.playerHudX = Math.max(W - 192 - 8, 450 - (intro.timer / 400) * 350);
        if(intro.timer > 500) { 
           intro.state = INTRO_STATES.READY; 
           setAnimating(false);
           setMessage('');
           // Bounce effect and final landing shake
           intro.playerOffY = -12;
           intro.shakeY = 5;
           // Add "landing dust" stars
           intro.particles = [...intro.particles, ...createImpactStars(W * 0.22, H * 0.75, 4)];
           setTimeout(() => { if(introRef.current) { introRef.current.playerOffY = 0; introRef.current.shakeY = 0; } }, 150);
        }
        break;
    }
    
    // VFX Timer
    if (intro.vfxType) {
      intro.vfxTimer += dt;
      if (intro.vfxTimer > 400) { 
        intro.vfxType = null; 
        intro.vfxTimer = 0; 
        intro.vfxData = null;
      }
    }
    
    // Particles update
    if (intro.particles.length > 0) {
      intro.particles.forEach(p => {
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.vy += 0.2 * (dt / 16); // gravity
        p.life -= dt;
      });
      intro.particles = intro.particles.filter(p => p.life > 0);
    }
  };

  const drawBattle = (ctx, W, H) => {
    const intro = introRef.current;
    
    ctx.save();
    ctx.translate(intro.shakeX, intro.shakeY);

    if(bgImgRef.current) {
      // Draw background with slight scroll
      ctx.save();
      ctx.translate(intro.bgScrollX, intro.bgScrollY);
      safeDrawImage(ctx, bgImgRef.current, -20, -20, W + 40, H + 40);
      ctx.restore();
    }
    
    // Trainer
    // Trainer
    if(intro.state !== INTRO_STATES.READY && intro.state !== INTRO_STATES.HUD_SLIDE && trainerImgRef.current) {
        const img = trainerImgRef.current;
        const frameW = img.width / 5;
        const frame = Math.min(4, intro.trainerFrame || 0);
        safeDrawImage(ctx, img, frame * frameW, 0, frameW, img.height, intro.trainerX, H*0.5, 80, 96);
    }
    
    // Enemy
    if(enemyImgRef.current && intro.enemyVisible) {
      ctx.globalAlpha = intro.enemyOpacity || 1; 
      ctx.save(); 
      const ex = intro.state === INTRO_STATES.READY ? W * 0.72 : (intro.enemyX || W * 0.72);
      
      // Fainting or normal position
      const fy = intro.enemyFainting ? intro.enemyFaintY : 0;
      ctx.translate(ex + intro.enemyOffX, H * 0.35 + intro.enemyOffY + fy); 
      
      ctx.scale(intro.enemyScale || 1, intro.enemyScale || 1);
      
      // Clipping if fainting
      if (intro.enemyFainting) {
        ctx.beginPath();
        ctx.rect(-50, -50, 100, 100 - fy);
        ctx.clip();
      }

      safeDrawImage(ctx, enemyImgRef.current, -48, -48, 96, 96); 
      ctx.restore(); ctx.globalAlpha = 1;
    }
    
    // Player PKMN Appearance Burst
    if (intro.burstRadius > 0) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(W * 0.2, H * 0.65, intro.burstRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player PKMN
    const showingPkmn = (intro.state === INTRO_STATES.READY || intro.state === INTRO_STATES.TRAINER_EXIT || intro.state === INTRO_STATES.HUD_SLIDE || intro.state === INTRO_STATES.POKEMON_APPEAR);
    if(showingPkmn && playerPkImgRef.current && intro.playerVisible) {
      let pop = 1;
      let brightness = 1;
      if (intro.state === INTRO_STATES.POKEMON_APPEAR) {
        pop = 0.3 + (intro.timer / 500) * 0.7; // Grow from 30% to 100%
        brightness = 4 - (intro.timer / 125); // Intense Flash
      }
      
      ctx.save();
      const pfy = intro.playerFainting ? intro.playerFaintY : 0;
      ctx.translate(W * 0.22 + intro.playerOffX, H * 0.75 + intro.playerOffY + pfy);
      ctx.scale(pop * (intro.playerScale || 1), pop * (intro.playerScale || 1));
      
      if (brightness > 1) {
        ctx.filter = `brightness(${brightness * 200}%)`;
      }

      // Clipping if fainting
      if (intro.playerFainting) {
        ctx.beginPath();
        ctx.rect(-50, -50, 100, 100 - pfy);
        ctx.clip();
      }

      safeDrawImage(ctx, playerPkImgRef.current, -48, -48, 96, 96);
      ctx.restore();
    }

    // Pokeball
    if(intro.ballVisible) {
        ctx.save();
        ctx.translate(intro.ballX, intro.ballY);
        ctx.rotate(intro.ballAngle);
        // Red Top
        ctx.beginPath(); ctx.fillStyle = '#E83030'; ctx.arc(0, 0, 5, Math.PI, 0); ctx.fill();
        // White Bottom
        ctx.beginPath(); ctx.fillStyle = '#F8F8F8'; ctx.arc(0, 0, 5, 0, Math.PI); ctx.fill();
        // Middle Line & Button
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
        ctx.beginPath(); ctx.fillStyle = '#333'; ctx.arc(0, 0, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.arc(0, 0, 1, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
    
    if (intro.vfxType === 'slash') {
      const vt = intro.vfxTimer / 400;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
      const vx = intro.vfxData?.x || (W * 0.72);
      const vy = intro.vfxData?.y || (H * 0.35);
      
      ctx.beginPath();
      ctx.moveTo(vx - 25 + vt*50, vy - 25);
      ctx.lineTo(vx + 25 - vt*50, vy + 25);
      ctx.stroke();
    }

    if (intro.vfxType === 'impact') {
      const vt = intro.vfxTimer / 400;
      const vx = intro.vfxData?.x || (W * 0.72);
      const vy = intro.vfxData?.y || (H * 0.35);
      
      ctx.fillStyle = '#fff';
      for(let i=0; i<4; i++) {
         const angle = (i * Math.PI / 2) + vt;
         const dist = 10 + vt * 30;
         ctx.beginPath();
         ctx.arc(vx + Math.cos(angle)*dist, vy + Math.sin(angle)*dist, 4 * (1-vt), 0, Math.PI*2);
         ctx.fill();
      }
    }

    if (intro.vfxType === 'fire') {
      const vt = intro.vfxTimer / 400;
      const vx = intro.vfxData?.x || (W * 0.72);
      const vy = intro.vfxData?.y || (H * 0.35);
      
      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; // Additive blending for fire
      ctx.fillStyle = `rgba(255, ${Math.floor(100+vt*155)}, 0, ${1-vt})`;
      for(let i=0; i<6; i++) {
        const offX = Math.sin(vt*10 + i) * 20;
        const offY = -vt * 50 + (i*5);
        ctx.beginPath();
        ctx.arc(vx + offX, vy + offY, 8 * (1-vt), 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Particles (Impact Stars)
    ctx.save();
    // Additive blending for sparkles/energy
    ctx.globalCompositeOperation = 'lighter';
    intro.particles.forEach(p => {
       const alpha = Math.max(0, p.life / 800);
       ctx.fillStyle = p.color || '#fff';
       ctx.globalAlpha = alpha;
       ctx.save();
       ctx.translate(p.x, p.y);
       ctx.rotate(p.life / 100);
       
       if (p.type === 'bubble') {
         ctx.beginPath();
         ctx.arc(0, 0, p.size, 0, Math.PI * 2);
         ctx.fill();
       } else {
         ctx.beginPath();
         for(let i=0; i<5; i++) {
           ctx.lineTo(Math.cos(i*Math.PI*0.8)*p.size, Math.sin(i*Math.PI*0.8)*p.size);
         }
         ctx.closePath();
         ctx.fill();
       }
       ctx.restore();
    });
    ctx.globalAlpha = 1.0;
    ctx.restore();
    
    // Medal Celebration
    if (intro.medalCelebration) {
      ctx.fillStyle = 'rgba(255,215,0,0.2)';
      ctx.fillRect(0,0,W,H);
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎖️', W/2, H/2 + 10);
    }
    
    if(intro.flashAlpha > 0) { ctx.fillStyle = `rgba(255,255,255,${intro.flashAlpha})`; ctx.fillRect(0,0,W,H); }
    
    // Horizontal Bars Transition (Chunky Retro Style)
    if (intro.state === INTRO_STATES.TRANSITION) {
      ctx.fillStyle = '#000';
      const bars = 8;
      const barHeight = H / bars;
      const progress = intro.transitionProgress;
      
      for (let i = 0; i < bars; i++) {
        const x = (i % 2 === 0) ? -W + (progress * 2 * W) : W - (progress * 2 * W);
        // Add a bit of pixelated steps to the movement
        const steppedX = Math.floor(x / 4) * 4;
        ctx.fillRect(steppedX, i * barHeight, W, barHeight + 1);
      }
    }
    
    ctx.restore();
  };

  const createImpactStars = (x, y, count = 5) => {
    const stars = [];
    for(let i=0; i<count; i++) {
      stars.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 1.5) * 4,
        life: 500 + Math.random() * 500,
        size: 3 + Math.random() * 4,
        color: '#fff',
        type: 'star'
      });
    }
    return stars;
  };

  const createBurstParticles = (x, y, count = 12) => {
    const p = [];
    for(let i=0; i<count; i++) {
      const angle = (i / count) * Math.PI * 2;
      p.push({
        x, y,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        life: 400 + Math.random() * 400,
        size: 2 + Math.random() * 3,
        color: i % 2 === 0 ? '#fff' : '#60A0F8', // White and blueish
        type: 'bubble'
      });
    }
    return p;
  };

  const playSequence = async (attacker, move) => {
    const intro = introRef.current;
    const isPlayer = attacker === 'player';
    const moveType = move?.type || 'NORMAL';
    const category = move?.category || 'Physical';
    const moveName = (move?.nombre || 'ATAQUE').toUpperCase();
    
    // Focus System: Target coordinates
    const targetX = isPlayer ? 300 * 0.72 : 300 * 0.22;
    const targetY = isPlayer ? 200 * 0.35 : 200 * 0.75;

    // Tweening logic for movement
    if (category === 'Physical') {
      // 1. Prepare (Quick hop)
      for(let i=0; i<4; i++) {
        const val = Math.sin((i / 4) * Math.PI) * 6;
        if(isPlayer) intro.playerOffY = -val; else intro.enemyOffY = -val;
        await new Promise(r => setTimeout(r, 16));
      }

      // 2. Launch / Elastic Slide Forward
      const slideDist = 36;
      const frames = 6;
      for(let i=1; i<=frames; i++) {
        const t = i / frames;
        const ease = t * (2 - t); // easeOutQuad
        if(isPlayer) intro.playerOffX = ease * slideDist; 
        else intro.enemyOffX = -ease * slideDist;
        await new Promise(r => setTimeout(r, 12));
      }
    } else {
      // Special Move: Focus on User (Vibration/Pulse)
      for(let i=0; i<8; i++) {
        const scale = 1 + Math.sin(i * 0.8) * 0.15;
        if(isPlayer) intro.playerScale = scale; else intro.enemyScale = scale;
        await new Promise(r => setTimeout(r, 30));
      }
      intro.playerScale = 1; intro.enemyScale = 1;
    }
    
    // 3. Impact & VFX (Focus on Target)
    let vfx = 'impact';
    if (moveType === 'FIRE') vfx = 'fire';
    else if (moveName.includes('ARAÑAZO') || moveName.includes('SLASH')) vfx = 'slash';
    
    intro.vfxType = vfx;
    intro.vfxTimer = 0;
    intro.vfxData = { x: targetX, y: targetY };
    
    // Flash Screen (Intense for impact)
    intro.flashAlpha = 0.7;
    setTimeout(() => { if(introRef.current) introRef.current.flashAlpha = 0; }, 60);

    // Create Particles at Target Focus
    intro.particles = [...intro.particles, ...createImpactStars(targetX, targetY)];

    // 4. Target Reaction (Rapid Stagger & Flickering)
    for(let i=0; i<12; i++) {
      intro.shakeX = (Math.random() - 0.5) * 18;
      intro.shakeY = (Math.random() - 0.5) * 18;
      if (isPlayer) intro.enemyVisible = !intro.enemyVisible;
      else intro.playerVisible = !intro.playerVisible;
      await new Promise(r => setTimeout(r, 25));
    }
    intro.shakeX = 0; intro.shakeY = 0;
    intro.enemyVisible = true; intro.playerVisible = true;
    
    // 5. Slide Back (Ease In)
    if (category === 'Physical') {
      const frames = 5;
      const startX = isPlayer ? intro.playerOffX : intro.enemyOffX;
      for(let i=1; i<=frames; i++) {
        const t = 1 - (i / frames);
        if(isPlayer) intro.playerOffX = startX * t; 
        else intro.enemyOffX = startX * t;
        await new Promise(r => setTimeout(r, 20));
      }
    }
    intro.playerOffX = 0; intro.enemyOffX = 0;
    intro.playerOffY = 0; intro.enemyOffY = 0;
  };

  const playFaintAnimation = async (target) => {
    const intro = introRef.current;
    if (target === 'enemy') {
      intro.enemyFainting = true;
      for (let i = 0; i <= 20; i++) {
        intro.enemyFaintY = i * 4.8; // Slide down 96px total
        await new Promise(r => setTimeout(r, 20));
      }
      intro.enemyVisible = false;
    } else {
      intro.playerFainting = true;
      for (let i = 0; i <= 20; i++) {
        intro.playerFaintY = i * 4.8;
        await new Promise(r => setTimeout(r, 20));
      }
      intro.playerVisible = false;
    }
  };

  const handleMoveSelection = async (moveKey) => {
    if (phase !== BATTLE_PHASES.SELECT || animating) return;
    const move = MOVE_DATA[moveKey] || MOVE_DATA.TACKLE;
    
    // Accuracy Check
    const hit = move.accuracy === 0 || (Math.random() * 100 < move.accuracy);
    
    setPhase(BATTLE_PHASES.ANIMATING);
    setMessage(`¡${starter.starter_nombre.toUpperCase()} USÓ ${move.nombre}!`);
    
    if (!hit) {
      setTimeout(() => {
        setMessage("¡Pero falló!");
        setTimeout(() => enemyTurn(), 1500);
      }, 1000);
      return;
    }

    await playSequence('player', move);
    
    const enemyData = isWild ? wildPk : { tipo: 'NORMAL' };
    const dmg = calculateDamage(starter, enemyData, move, true);
    const newLeaderHP = Math.max(0, leaderHP - dmg);
    setLeaderHP(newLeaderHP);

    const eff = getEffectiveness(move.type, enemyData.tipo);
    if (eff > 1) setMessage("¡Es muy eficaz!");
    else if (eff < 1 && eff > 0) setMessage("No es muy eficaz...");
    else if (eff === 0) setMessage(`No afecta a ${enemyName.toUpperCase()}...`);

    if (newLeaderHP <= 0) {
      setTimeout(async () => {
        await playFaintAnimation('enemy');
        setMessage(`¡${enemyName.toUpperCase()} SE DEBILITÓ!`);
        setPhase(BATTLE_PHASES.FINISHED);
        if (isWild) {
          ganarBatalla().catch(e => console.error(e));
        } else {
          // Gym Battle Victory
          completarGimnasio(gymId, starter.starter_id, starter.starter_nombre)
            .then(res => {
              if (res.success) {
                // Potential badge logic here
                console.log("Badge earned or Habit completed!");
              }
            })
            .catch(e => console.error(e));
        }
        setTimeout(() => navigate('city'), 2500);
      }, 1000);
    } else {
      setTimeout(() => enemyTurn(), 1500);
    }
  };

  const enemyTurn = async () => {
    setPhase(BATTLE_PHASES.ENEMY_ACTION);
    
    const enemySpecies = wildPk?.id || 19;
    const enemyMoves = POKEMON_MOVES[enemySpecies] || ['TACKLE'];
    const randomMoveKey = enemyMoves[Math.floor(Math.random() * enemyMoves.length)];
    const enemyMove = MOVE_DATA[randomMoveKey] || MOVE_DATA.TACKLE;

    setMessage(`¡${enemyName.toUpperCase()} USÓ ${enemyMove.nombre}!`);
    
    const hit = enemyMove.accuracy === 0 || (Math.random() * 100 < enemyMove.accuracy);
    if (!hit) {
      setTimeout(() => {
        setMessage("¡Pero falló!");
        setTimeout(() => { setPhase(BATTLE_PHASES.SELECT); setMessage(''); }, 1500);
      }, 1000);
      return;
    }

    await playSequence('enemy', enemyMove);
    
    const dmg = calculateDamage(wildPk || { nivel: 5 }, { tipo: 'NORMAL' }, enemyMove, false);
    setPlayerHP(prev => Math.max(0, prev - dmg));
    
    const eff = getEffectiveness(enemyMove.type, 'NORMAL'); // Player type hardcoded for now
    if (eff > 1) setMessage("¡Es muy eficaz!");
    else if (eff < 1 && eff > 0) setMessage("No es muy eficaz...");

    setTimeout(async () => { 
      if (playerHP - dmg <= 0) {
        await playFaintAnimation('player');
        setMessage(`¡${starter.starter_nombre.toUpperCase()} SE DEBILITÓ!`);
        setPhase(BATTLE_PHASES.FINISHED);
        setTimeout(() => navigate('city'), 2000);
      } else {
        setPhase(BATTLE_PHASES.SELECT); 
        setMessage(''); 
      }
    }, 1500);
  };

  const handleCapture = async () => {
    if (phase !== BATTLE_PHASES.SELECT) return;
    setPhase(BATTLE_PHASES.ANIMATING);
    const intro = introRef.current;
    
    // 1. Throw Animation
    setMessage(`¡Has lanzado una POKÉ BALL!`);
    intro.ballVisible = true;
    intro.ballX = 30; intro.ballY = 160;
    
    for(let i=0; i<=20; i++) {
      const t = i / 20;
      intro.ballX = 30 + (216 - 30) * t;
      intro.ballY = 160 + (88 - 160) * t - Math.sin(t * Math.PI) * 60;
      intro.ballAngle += 0.3;
      await new Promise(r => setTimeout(r, 25));
    }
    
    intro.ballVisible = false;
    intro.enemyVisible = false; // "Inside" the ball
    intro.flashAlpha = 0.8; setTimeout(() => intro.flashAlpha = 0, 100);
    
    // 2. Shake Animation
    const success = Math.random() < (1.2 - (leaderHP / 100));
    const shakes = success ? 3 : Math.floor(Math.random() * 3);
    
    for(let s=0; s<shakes; s++) {
      setMessage(`... ... ...`);
      // Shake left/right
      for(let j=0; j<4; j++) {
        intro.shakeX = (j % 2 === 0 ? 5 : -5);
        await new Promise(r => setTimeout(r, 100));
      }
      intro.shakeX = 0;
      await new Promise(r => setTimeout(r, 500));
    }

    if (success) {
      setMessage(`¡Ya está! ¡${wildPk.nombre} atrapado!`);
      await capturarPokemon(wildPk.id, wildPk.nombre);
      setTimeout(() => navigate('city'), 2000);
    } else {
      intro.enemyVisible = true;
      intro.flashAlpha = 0.5; setTimeout(() => intro.flashAlpha = 0, 100);
      setMessage(`¡Oh, no! ¡El POKÉMON se ha escapado!`);
      setTimeout(() => {
        setPhase(BATTLE_PHASES.SELECT);
        setMessage('¿Qué quieres hacer?');
      }, 1500);
    }
  };

  const handleHabitAttack = async (h) => {
    if (animating || localCompleted[h.habito_id || h.id]) return;
    setAnimating(true);
    const hId = h.habito_id || h.id;
    
    setMessage(`¡HAS COMPLETADO ${h.nombre.toUpperCase()}!`);
    await playSequence('player', { nombre: h.nombre, type: 'NORMAL' });
    
    // Normalizamos el gymId para la API
    const apiGymId = String(gymId || '').trim();
    const r = await completarHabito(apiGymId, hId).catch(e => {
      console.error(e);
      return { success: false };
    });

    if (r.success) {
      setLocalCompleted(prev => ({...prev, [hId]: true}));
      const doneSoFar = Object.keys(localCompleted).length + 1;
      const total = habitsForStage.length;
      const newHP = 100 - Math.min(100, Math.round((doneSoFar / total) * 100));
      setLeaderHP(newHP);

      if (newHP <= 0) {
        setTimeout(async () => {
          await playFaintAnimation('enemy');
          
          // Check if there is another phase (specifically for vestirse)
          const isVestirse = normalizedGymId === 'vestirse';
          const hasMorePhases = isVestirse && currentPhase === 0;

          if (hasMorePhases) {
            setMessage(`¡HAS SUPERADO LA FASE DE QUITAR ROPA!`);
            setTimeout(async () => {
              setCurrentPhase(1);
              setLocalCompleted({});
              setLeaderHP(100);
              // Visual transition
              const intro = introRef.current;
              intro.state = INTRO_STATES.ENEMY_ENTER;
              intro.timer = 0;
              intro.enemyX = 400;
              intro.enemyVisible = true;
              intro.enemyFainting = false;
              intro.enemyFaintY = 0;
              setMessage(`¡AHORA PREPÁRATE PARA PONERTE LA ROPA!`);
              setTimeout(() => { setAnimating(false); }, 1500);
            }, 1500);
          } else {
            setMessage(`¡LÍDER DERROTADO! ¡GANASTE MEDALLA!`);
            const intro = introRef.current;
            intro.medalCelebration = true;
            completarGimnasio(apiGymId, starter?.pokemon_id, starter?.pokemon_nombre).catch(e => console.error(e));
            setTimeout(() => navigate('city'), 2500);
          }
        }, 1000);
      } else {
        setTimeout(() => { setAnimating(false); setMessage(''); }, 800);
      }

    } else {
      setMessage("¡Error al sincronizar! Reintenta.");
      setTimeout(() => { setAnimating(false); setMessage(''); }, 1500);
    }
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
              <div style={{ position: 'absolute', top: '12px', left: '8px', transition: 'transform 0.4s', transform: `translateX(${introRef.current.enemyHudX}px)` }}>
                <HPBar current={leaderHP} max={100} name={enemyName} level={isWild ? wildPk.nivel : 30} alignment="enemy" />
              </div>
              <div style={{ position: 'absolute', bottom: '12px', right: '8px', transition: 'transform 0.4s', transform: `translateX(${introRef.current.playerHudX - (300-192-8)}px)` }}>
                <HPBar current={playerHP} max={100} name={starter.starter_nombre} level={starter.starter_nivel} exp={starter.xp} alignment="player" />
              </div>
            </>
          )}
        </div>

        <div style={{ flex: '0 0 42%', background: '#fff', borderTop: '4px solid #333', display: 'flex', flexDirection: 'column', position: 'relative', backgroundImage: `url(${getAssetPath('Graphics/pictures/battle/overlay_message.png')})`, backgroundSize: '100% 100%', imageRendering:'pixelated', zIndex: 10 }}>
          <img 
            src={getAssetPath(`Graphics/characters/trchar${String(user?.avatar || 0).padStart(3, '0')}.png`)} 
            style={{ width: 44, height: 44, objectFit: 'none', objectPosition: '0 0', imageRendering: 'pixelated', position: 'absolute', bottom: '4px', left: '8px' }} 
            alt="Player"
          />
          <div style={{ padding: '24px 24px 10px 56px', fontSize: 10, lineHeight: '1.4em', color: '#fff', height: '70px', textShadow:'0 0 4px #000, 2px 2px 0 #333', overflow: 'hidden', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            {message || (isWild ? '¿QUÉ DEBE HACER TU POKÉMON?' : '¡COMPLETA TUS HÁBITOS!') }
          </div>
          <div style={{ 
            flex: 1, 
            padding: '0 16px 16px', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gridAutoRows: '50px',
            gap: 8,
            overflowY: 'auto'
          }}>
            {isWild ? (
              menuView === 'main' ? (
                <>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={() => setMenuView('moves')}>💪 LUCHAR</button>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={() => setMessage("¡Bolsa vacía!")}>🎒 MOCHILA</button>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={() => setMessage("¡Sólo tienes uno!")}>🐢 PKMN</button>
                  <button disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={() => navigate('city')}>🏃 HUIR</button>
                </>
              ) : (
                <>
                  {(POKEMON_MOVES[parseInt(user?.starter_id)] || ['TACKLE']).map(mKey => (
                    <button key={mKey} disabled={phase !== BATTLE_PHASES.SELECT} style={modernButtonStyle} onClick={() => handleMoveSelection(mKey)}>
                      {MOVE_DATA[mKey]?.nombre || mKey}
                    </button>
                  ))}
                  <button style={{ ...modernButtonStyle, background: '#666' }} onClick={() => setMenuView('main')}>VOLVER</button>
                </>
              )
            ) : (
              habitsForStage.map(h => {
                const done = h.completado || localCompleted[h.habito_id || h.id];
                return (
                  <button key={h.habito_id || h.id} disabled={done || animating} style={{ ...modernButtonStyle, opacity: done ? 0.5 : 1, minHeight: '50px' }} onClick={() => handleHabitAttack(h)}>
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
