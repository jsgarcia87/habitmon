/**
 * battleAnimations.js
 * Visual effects for the BattleScreen canvas.
 */

export const ANIM_TYPES = {
  STRIKE: 'strike',
  PROJECTILE: 'projectile',
  FLASH: 'flash',
  SHAKE: 'shake',
  BOUNCE: 'bounce',
  PARTICLE: 'particle',
  TEXT: 'text'
};

export const createAnimation = (type, params) => {
  return {
    type,
    timer: 0,
    duration: params.duration || 500,
    ...params
  };
};

/**
 * Updates animations and calculates sprite offsets
 * @returns { anims: [], playerOffset: {x,y}, enemyOffset: {x,y} }
 */
export const updateBattleAnimations = (anims, dt) => {
  const nextAnims = anims
    .map(a => ({ ...a, timer: a.timer + dt }))
    .filter(a => a.timer < a.duration);

  const offsets = {
    player: { x: 0, y: 0 },
    enemy: { x: 0, y: 0 }
  };

  nextAnims.forEach(a => {
    const t = a.timer / a.duration;
    if (a.type === ANIM_TYPES.SHAKE) {
      const amt = (1 - t) * (a.amount || 10);
      const val = Math.sin(t * Math.PI * 10) * amt;
      if (a.target === 'player') offsets.player.x += val;
      else offsets.enemy.x += val;
    }
    if (a.type === ANIM_TYPES.BOUNCE) {
      const amt = (1 - t) * (a.amount || 20);
      const val = -Math.abs(Math.sin(t * Math.PI)) * amt;
      if (a.target === 'player') offsets.player.y += val;
      else offsets.enemy.y += val;
    }
  });

  return { nextAnims, offsets };
};

export const drawBattleAnimations = (ctx, anims, W, H) => {
  anims.forEach(a => {
    const t = a.timer / a.duration;
    
    switch (a.type) {
      case ANIM_TYPES.STRIKE:
        ctx.strokeStyle = a.color || 'white';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 10 + t * 40, 0, Math.PI * 2);
        ctx.stroke();
        break;
        
      case ANIM_TYPES.PROJECTILE:
        const x = a.startX + (a.endX - a.startX) * t;
        const y = a.startY + (a.endY - a.startY) * t;
        ctx.fillStyle = a.color || 'yellow';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case ANIM_TYPES.PARTICLE:
        ctx.fillStyle = a.color || 'white';
        const px = a.x + (a.vx || 0) * t;
        const py = a.y + (a.vy || 0) * t;
        ctx.globalAlpha = 1 - t;
        ctx.fillRect(px, py, a.size || 4, a.size || 4);
        ctx.globalAlpha = 1;
        break;
        
      case ANIM_TYPES.FLASH:
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - t)})`;
        ctx.fillRect(0, 0, W, H);
        break;

      case ANIM_TYPES.TEXT:
        ctx.fillStyle = a.color || 'white';
        ctx.font = 'bold 10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(a.text, a.x, a.y - (t * 20));
        ctx.textAlign = 'left';
        break;
    }
  });
};

export const getMoveAnimation = (moveKey, isPlayer, W, H) => {
  const pPos = { x: W * 0.25, y: H * 0.7 };
  const ePos = { x: W * 0.75, y: H * 0.35 };
  
  const start = isPlayer ? pPos : ePos;
  const end = isPlayer ? ePos : pPos;
  const target = isPlayer ? 'enemy' : 'player';
  const attacker = isPlayer ? 'player' : 'enemy';
  
  const animations = [];

  // Attacker lunge
  animations.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 300, amount: 15 }));

  switch (moveKey) {
    case 'TACKLE':
    case 'SCRATCH':
      animations.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 300, color: '#fff' }));
      break;
    case 'EMBER':
      for(let i=0; i<5; i++) {
        animations.push(createAnimation(ANIM_TYPES.PARTICLE, { 
          x: start.x, y: start.y, 
          vx: (end.x - start.x) + (Math.random()-0.5)*40,
          vy: (end.y - start.y) + (Math.random()-0.5)*40,
          duration: 600 + i*50, color: '#ff4500', size: 6 
        }));
      }
      break;
    case 'WATER_GUN':
      for(let i=0; i<8; i++) {
        animations.push(createAnimation(ANIM_TYPES.PARTICLE, { 
          x: start.x, y: start.y, 
          vx: (end.x - start.x),
          vy: (end.y - start.y),
          duration: 400 + i*40, color: '#1e90ff', size: 8 
        }));
      }
      break;
    case 'VINE_WHIP':
      animations.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 400, color: '#32cd32' }));
      break;
    case 'THUNDER_SHOCK':
      for(let i=0; i<10; i++) {
        animations.push(createAnimation(ANIM_TYPES.PARTICLE, { 
          x: end.x + (Math.random()-0.5)*40, 
          y: end.y + (Math.random()-0.5)*40, 
          duration: 300, color: '#ffff00', size: 4 
        }));
      }
      animations.push(createAnimation(ANIM_TYPES.FLASH, { duration: 200 }));
      break;
    case 'CONFUSION':
      animations.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 600, color: '#8a2be2' }));
      animations.push(createAnimation(ANIM_TYPES.FLASH, { duration: 500 }));
      break;
    default:
      animations.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 300, color: '#fff' }));
  }

  // Damage shake
  animations.push(createAnimation(ANIM_TYPES.SHAKE, { target: target, duration: 400, amount: 12 }));

  return animations;
};
