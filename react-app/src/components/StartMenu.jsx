import React, { useState } from 'react';

const StartMenu = ({ isOpen, onClose, onNavigate, user }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = [
    { label: 'POKÉDEX', icon: '📖', id: 'pokedex' },
    { label: 'POKÉMON', icon: '🐾', id: 'pokemon' },
    { label: 'BOLSA', icon: '🎒', id: 'bag' },
    { label: 'AGENDA', icon: '📋', id: 'agenda' },
    { label: user?.username?.toUpperCase() || 'FICHA', icon: '🆔', id: 'profile' },
    { label: 'GUARDAR', icon: '💾', id: 'save' },
    { label: 'OPCIONES', icon: '⚙️', id: 'admin' },
    { label: 'SALIR', icon: '❌', id: 'exit' },
  ];

  if (!isOpen) return null;

  const handleAction = (id) => {
    if (id === 'exit') {
      onClose();
    } else if (id === 'save') {
      alert('¡Partida guardada!'); // Temporary
      onClose();
    } else {
      onNavigate(id);
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        pointerEvents: 'none'
      }}
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          pointerEvents: 'auto',
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Menu Box */}
      <div 
        className="animate-slide-in-right retro-panel"
        style={{
          width: '180px',
          height: 'fit-content',
          marginTop: '20px',
          marginRight: '10px',
          padding: '8px 4px',
          background: '#fff',
          pointerEvents: 'auto',
          border: '4px solid #333',
          boxShadow: '6px 6px 0px rgba(0,0,0,0.3)'
        }}
      >
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => handleAction(item.id)}
            onMouseEnter={() => setSelectedIndex(index)}
            style={{
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              position: 'relative'
            }}
          >
            {/* Selection Arrow (GSC style) */}
            {selectedIndex === index && (
              <span style={{ 
                position: 'absolute', 
                left: '-2px', 
                fontSize: '12px',
                animation: 'pulse 0.4s infinite alternate'
              }}>
                ▶
              </span>
            )}
            
            <span style={{ fontSize: '12px', marginLeft: '12px' }}>{item.icon}</span>
            <span style={{ 
              fontSize: '8px', 
              fontFamily: '"Press Start 2P"',
              color: '#333'
            }}>
              {item.label}
            </span>
          </div>
        ))}

        {/* Bottom border decoration */}
        <div style={{
          height: '4px',
          background: '#333',
          margin: '4px 8px',
          opacity: 0.1
        }} />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default StartMenu;
