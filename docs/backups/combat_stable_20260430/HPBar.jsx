import React from 'react';
import { getAssetPath } from '../api/assets';

const HPBar = ({ current, max, alignment = 'player', name = 'PKMN', level = 5 }) => {
  // Ensure we have numbers. Fallback to 1/1 if data is missing to avoid NaN.
  const cur = Number(current) || 0;
  const mx = Number(max) || 100;
  const pct = Math.max(0, Math.min(100, (cur / mx) * 100));

  // Pokemon HP Colors: Green > 50%, Yellow > 20%, Red <= 20%
  let hpColor = '#00FF00'; // Green
  if (pct <= 20) hpColor = '#FF0000'; // Red
  else if (pct <= 50) hpColor = '#F8D030'; // Yellow

  // Databox positioning
  const isPlayer = alignment === 'player';
  
  return (
    <div style={{
      width: 160,
      height: 50,
      position: 'relative',
      backgroundImage: `url(${getAssetPath(isPlayer ? 'Graphics/pictures/battle/databox_normal.png' : 'Graphics/pictures/battle/databox_normal_foe.png')})`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
      padding: '8px'
    }}>
      {/* Name */}
      <div style={{
        position: 'absolute',
        top: 6,
        left: isPlayer ? 24 : 8,
        fontFamily: '"Press Start 2P"',
        fontSize: 7,
        color: '#333'
      }}>
        {String(name || 'PKMN').toUpperCase()}
      </div>

      {/* Level */}
      <div style={{
        position: 'absolute',
        top: 6,
        right: isPlayer ? 8 : 24,
        fontFamily: '"Press Start 2P"',
        fontSize: 7,
        color: '#333'
      }}>
        Lv{level}
      </div>

      {/* HP Bar */}
      <div style={{
        position: 'absolute',
        top: 24,
        left: isPlayer ? 84 : 24,
        width: 66,
        height: 4,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 1
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: hpColor,
          transition: 'width 0.6s ease-out, background-color 0.3s'
        }} />
      </div>

      {/* HP Text (Current/Max) - Only for Player */}
      {isPlayer && (
        <div style={{
          position: 'absolute',
          bottom: 4,
          right: 10,
          fontFamily: '"Press Start 2P"',
          fontSize: 6,
          color: '#333'
        }}>
          {Math.ceil(cur)}/{mx}
        </div>
      )}
    </div>
  );
};

export default HPBar;
