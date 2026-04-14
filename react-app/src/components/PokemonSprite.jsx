import React from 'react';
import { getAssetPath } from '../api';

const PokemonSprite = ({ id, back = false, shiny = false, style = {} }) => {
  // Format ID to 3 digits (e.g. 1 -> 001, 152 -> 152)
  const formattedId = String(id).padStart(3, '0');
  
  // Extension logic (simplificada para RMXP structure)
  let suffix = '';
  if (back) suffix += 'b';
  if (shiny) suffix += 's';
  
  const src = getAssetPath(`/Graphics/battlers/${formattedId}${suffix}.png`);

  return (
    <div 
      className="pokemon-sprite-container"
      style={{
        width: '96px',
        height: '96px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        imageRendering: 'pixelated',
        ...style
      }}
    >
      <img 
        src={src} 
        alt={`Pokemon ${id}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        onError={(e) => {
          // Fallback if shiny/back doesn't exist
          if (suffix !== '') {
            e.target.src = getAssetPath(`/Graphics/battlers/${formattedId}.png`);
          }
        }}
      />
    </div>
  );
};

export default PokemonSprite;
