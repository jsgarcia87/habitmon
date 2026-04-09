import React from 'react';

/**
 * SpriteAvatar: Renderiza un sprite desde un spritesheet de 4x4 (estilo RMXP/GBC)
 * @param {string} path - Ruta de la imagen
 * @param {number} size - Tamaño deseado en pantalla
 * @param {number} col - Columna del frame (0-3)
 * @param {number} row - Fila del frame (0-3)
 * @param {object} style - Estilos adicionales
 */
export const SpriteAvatar = ({ path, size = 64, col = 0, row = 0, style = {} }) => {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: `url('${path}')`,
      backgroundSize: '400% 400%', // Spritesheet 4x4
      backgroundPosition: `${(col * 33.33).toFixed(2)}% ${(row * 33.33).toFixed(2)}%`,
      imageRendering: 'pixelated',
      backgroundRepeat: 'no-repeat',
      ...style
    }} />
  );
};

export default SpriteAvatar;
