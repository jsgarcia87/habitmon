/**
 * battleAnimations.js
 * Visual effects for the BattleScreen canvas.
 * Matches Habitmon Essentials Technical Guide spec exactly.
 */

export const ANIM_TYPES = {
  STRIKE:      'strike',
  PROJECTILE:  'projectile',
  FLASH:       'flash',
  SHAKE:       'shake',
  BOUNCE:      'bounce',
  PARTICLE:    'particle',
  TEXT:        'text',
  FLASH_SPRITE:'flash_sprite',
  FAINT:       'faint',
  CAPTURE:     'capture',
};

export const createAnimation = (type, params) => ({
  type,
  timer: 0,
  duration: params.duration || 500,
  ...params
});

/**
 * Updates all active animations and computes per-frame sprite offsets.
 * Returns { nextAnims, offsets } where offsets = { player, enemy }
 * each with { x, y, visible, opacity, scale }
 */
export const updateBattleAnimations = (anims, dt) => {
  const nextAnims = anims
    .map(a => ({ ...a, timer: a.timer + dt }))
    .filter(a => a.timer < a.duration);

  const offsets = {
    player: { x: 0, y: 0, visible: true, opacity: 1, scale: 1 },
    enemy:  { x: 0, y: 0, visible: true, opacity: 1, scale: 1 }
  };

  nextAnims.forEach(a => {
    const t = Math.min(1, a.timer / a.duration);

    switch (a.type) {
      case ANIM_TYPES.SHAKE: {
        const amt = (1 - t) * (a.amount || 10);
        const val = Math.sin(t * Math.PI * 10) * amt;
        if (a.target === 'player') offsets.player.x += val;
        else offsets.enemy.x += val;
        break;
      }
      case ANIM_TYPES.BOUNCE: {
        const amt = (1 - t) * (a.amount || 20);
        const val = -Math.abs(Math.sin(t * Math.PI)) * amt;
        if (a.target === 'player') offsets.player.y += val;
        else offsets.enemy.y += val;
        break;
      }
      case ANIM_TYPES.FLASH_SPRITE: {
        // Classic blink: every 50ms toggle
        const visible = Math.floor(a.timer / 50) % 2 === 0;
        if (a.target === 'player') offsets.player.visible = visible;
        else offsets.enemy.visible = visible;
        break;
      }
      case ANIM_TYPES.FAINT: {
        // Slide down + fade out
        const drop = t * 80;
        const alpha = 1 - t;
        if (a.target === 'player') {
          offsets.player.y    += drop;
          offsets.player.opacity = alpha;
        } else {
          offsets.enemy.y    += drop;
          offsets.enemy.opacity = alpha;
        }
        break;
      }
      case ANIM_TYPES.CAPTURE: {
        /**
         * Capture sequence (spec §8.3):
         *  0.00–0.25 : Ball falls from top → Pokémon position
         *  0.25–0.50 : Pokémon shrinks to 0 + fades (absorbed)
         *  0.50–0.85 : Ball bounces 3 times on platform
         *  0.85–1.00 : Ball rests still (success flash done in drawBattleAnimations)
         */
        if (t < 0.25) {
          const ft = t / 0.25;
          // ease-in quad
          a._ballX = a.targetX;
          a._ballY = -20 + (a.targetY - (-20)) * (ft * ft);
          a._ballVisible = true;
          a._ballAngle   = ft * Math.PI * 4; // rotate as it falls
        } else if (t < 0.50) {
          const st = (t - 0.25) / 0.25;
          a._ballX = a.targetX;
          a._ballY = a.targetY;
          a._ballVisible = true;
          a._ballAngle   = Math.PI * 4;
          // Shrink & fade the target sprite
          const side = a.target === 'enemy' ? 'enemy' : 'player';
          offsets[side].scale   = 1 - st;
          offsets[side].opacity = 1 - st;
        } else if (t < 0.85) {
          const bt = (t - 0.50) / 0.35;
          // 3 decaying parabolic bounces
          const bounce = Math.abs(Math.sin(bt * Math.PI * 3)) * (1 - bt) * 28;
          a._ballX = a.targetX;
          a._ballY = a.targetY - bounce;
          a._ballVisible = true;
          // Slight wobble angle during bounces
          a._ballAngle = Math.sin(bt * Math.PI * 6) * 0.3;
          // Keep target invisible
          const side = a.target === 'enemy' ? 'enemy' : 'player';
          offsets[side].scale   = 0;
          offsets[side].opacity = 0;
        } else {
          // Ball at rest
          a._ballX = a.targetX;
          a._ballY = a.targetY;
          a._ballVisible = true;
          a._ballAngle   = 0;
          const side = a.target === 'enemy' ? 'enemy' : 'player';
          offsets[side].scale   = 0;
          offsets[side].opacity = 0;
        }
        break;
      }
      default: break;
    }
  });

  return { nextAnims, offsets };
};

// ─── Draw helpers ──────────────────────────────────────────────────────────

/**
 * Draws all active animation overlays on the canvas.
 * Note: sprite-level effects (shake/bounce/faint/capture shrink) are handled
 * via offsets returned by updateBattleAnimations.
 */
export const drawBattleAnimations = (ctx, anims, W, H) => {
  anims.forEach(a => {
    const t = Math.min(1, a.timer / a.duration);

    switch (a.type) {
      case ANIM_TYPES.STRIKE: {
        ctx.save();
        ctx.strokeStyle = a.color || '#fff';
        ctx.lineWidth   = 3;
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 8 + t * 35, 0, Math.PI * 2);
        ctx.stroke();
        // Inner flash
        ctx.fillStyle   = a.color || '#fff';
        ctx.globalAlpha = (1 - t) * 0.4;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 6 + t * 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case ANIM_TYPES.PROJECTILE: {
        const px = a.startX + (a.endX - a.startX) * t;
        const py = a.startY + (a.endY - a.startY) * t;
        ctx.fillStyle = a.color || 'yellow';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case ANIM_TYPES.PARTICLE: {
        const px = a.x + (a.vx || 0) * t;
        const py = a.y + (a.vy || 0) * t + 30 * t * t; // gravity
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle   = a.color || '#fff';
        ctx.fillRect(px - (a.size||4)/2, py - (a.size||4)/2, a.size||4, a.size||4);
        ctx.restore();
        break;
      }

      case ANIM_TYPES.FLASH: {
        ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - t)})`;
        ctx.fillRect(0, 0, W, H);
        break;
      }

      case ANIM_TYPES.TEXT: {
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.font        = 'bold 10px "Press Start 2P", monospace';
        ctx.textAlign   = 'center';
        ctx.fillStyle   = '#111';
        ctx.fillText(a.text, a.x + 1, a.y - t * 20 + 1);
        ctx.fillStyle   = a.color || '#fff';
        ctx.fillText(a.text, a.x, a.y - t * 20);
        ctx.restore();
        break;
      }

      case ANIM_TYPES.CAPTURE: {
        if (a._ballVisible) {
          drawPokeball(ctx, a._ballX ?? a.targetX, a._ballY ?? a.targetY, 7, a._ballAngle ?? 0);
        }
        // Success flash at the end
        if (t > 0.90) {
          const ft = (t - 0.90) / 0.10;
          ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - ft)})`;
          ctx.fillRect(0, 0, W, H);
        }
        break;
      }

      default: break;
    }
  });
};

function drawPokeball(ctx, x, y, radius, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  // Red top
  ctx.fillStyle = '#E8190C';
  ctx.beginPath(); ctx.arc(0, 0, radius, Math.PI, 0); ctx.fill();
  // White bottom
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI); ctx.fill();
  // Outline + divider
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.stroke();
  // Center button
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, 0, radius * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

// ─── Move animations ───────────────────────────────────────────────────────

export const getMoveAnimation = (moveKey, isPlayer, W, H) => {
  const pPos = { x: W * 0.22, y: H * 0.68 };
  const ePos = { x: W * 0.75, y: H * 0.38 };

  const start    = isPlayer ? pPos : ePos;
  const end      = isPlayer ? ePos : pPos;
  const target   = isPlayer ? 'enemy' : 'player';
  const attacker = isPlayer ? 'player' : 'enemy';

  const anims = [];

  // Attacker lunge toward enemy
  anims.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 250, amount: 14 }));

  switch (moveKey) {
    case 'TACKLE':
    case 'SCRATCH':
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 300, color: '#fff' }));
      break;

    case 'EMBER':
      for (let i = 0; i < 6; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x, y: start.y,
          vx: (end.x - start.x) * (0.9 + Math.random()*0.2) + (Math.random()-0.5)*30,
          vy: (end.y - start.y) * (0.9 + Math.random()*0.2),
          duration: 500 + i * 60, color: i % 2 === 0 ? '#ff4500' : '#ffa500', size: 5 + Math.random()*4
        }));
      }
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 250, color: '#ff6600' }));
      break;

    case 'WATER_GUN':
      for (let i = 0; i < 10; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x, y: start.y,
          vx: (end.x - start.x) * (0.9 + i*0.01),
          vy: (end.y - start.y) + (Math.random()-0.5)*10,
          duration: 380 + i * 30, color: i % 3 === 0 ? '#87ceeb' : '#1e90ff', size: 7
        }));
      }
      break;

    case 'VINE_WHIP':
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 400, color: '#32cd32' }));
      for (let i = 0; i < 4; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x, y: end.y,
          vx: (Math.random()-0.5)*60, vy: (Math.random()-0.5)*60,
          duration: 400, color: '#228B22', size: 5
        }));
      }
      break;

    case 'THUNDER_SHOCK':
      for (let i = 0; i < 12; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random()-0.5)*50,
          y: end.y + (Math.random()-0.5)*50,
          vx: (Math.random()-0.5)*20, vy: (Math.random()-0.5)*20,
          duration: 250 + Math.random()*200, color: '#ffff00', size: 3 + Math.random()*4
        }));
      }
      anims.push(createAnimation(ANIM_TYPES.FLASH, { duration: 200 }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 200, color: '#ffdd00' }));
      break;

    case 'CONFUSION':
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 600, color: '#9b59b6' }));
      anims.push(createAnimation(ANIM_TYPES.FLASH, { duration: 400 }));
      for (let i = 0; i < 5; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random()-0.5)*40, y: end.y + (Math.random()-0.5)*40,
          vx: (Math.random()-0.5)*30, vy: (Math.random()-0.5)*30,
          duration: 500, color: '#8e44ad', size: 5
        }));
      }
      break;

    default:
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 300, color: '#fff' }));
  }

  // Universal: damage shake + sprite blink
  anims.push(createAnimation(ANIM_TYPES.SHAKE,       { target, duration: 450, amount: 10 }));
  anims.push(createAnimation(ANIM_TYPES.FLASH_SPRITE,{ target, duration: 500 }));

  return anims;
};
