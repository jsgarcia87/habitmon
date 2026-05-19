import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const BAG_ITEMS = [
  {
    id: 'pokeball',
    name: 'POKÉ BALL',
    description: 'Dispositivo para atrapar Pokémon salvajes. Úsalo en combates contra Pokémon salvajes.',
    icon: '🔴',
    usableOutside: false
  },
  {
    id: 'superball',
    name: 'SUPER BALL',
    description: 'Dispositivo de alto rendimiento para capturar Pokémon salvajes.',
    icon: '🔵',
    usableOutside: false
  },
  {
    id: 'potion',
    name: 'POCIÓN',
    description: 'Medicina líquida que restaura 20 PS. Se puede usar para curar a tu compañero Pokémon.',
    icon: '🧪',
    usableOutside: true,
    healAmount: 20
  },
  {
    id: 'superpotion',
    name: 'SUPERPOCIÓN',
    description: 'Medicina de alta eficacia que restaura 50 PS. Cura a tu compañero Pokémon.',
    icon: '🥤',
    usableOutside: true,
    healAmount: 50
  }
];

const BagScreen = ({ navigate }) => {
  const { user, starter, usarObjeto, notify } = useGame();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dialogue, setDialogue] = useState('¿Qué objeto deseas utilizar hoy de tu mochila?');
  const [isConfirming, setIsConfirming] = useState(false);

  const selectedItem = BAG_ITEMS[selectedIdx];
  const count = user?.inventario?.[selectedItem.id] ?? 0;

  const handleUseItem = async () => {
    if (count <= 0) {
      setDialogue('¡No tienes unidades de este objeto!');
      setIsConfirming(false);
      return;
    }

    if (!selectedItem.usableOutside) {
      setDialogue('Este objeto no se puede usar aquí. ¡Úsalo durante batallas contra Pokémon salvajes!');
      setIsConfirming(false);
      return;
    }

    setDialogue(`Usando ${selectedItem.name} en ${starter?.starter_nombre?.toUpperCase() || 'compañero'}...`);
    const r = await usarObjeto(selectedItem.id);

    if (r.success) {
      setDialogue(`¡Usaste ${selectedItem.name}! Los PS de ${starter?.starter_nombre?.toUpperCase() || 'tu compañero'} se han restablecido.`);
      setIsConfirming(false);
      notify({ message: `¡Curaste a ${starter?.starter_nombre || 'compañero'}!`, type: 'success' });
    } else {
      setDialogue(`Error: ${r.message || 'No se pudo usar el objeto.'}`);
      setIsConfirming(false);
    }
  };

  return (
    <div className="retro-bag-container" style={{
      width: '100vw',
      height: '100dvh',
      background: '#442C54',
      fontFamily: '"Press Start 2P", monospace',
      color: '#333',
      padding: '16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#835399',
        color: '#fff',
        padding: '8px 12px',
        border: '3px solid #000',
        borderRadius: '4px',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '10px' }}>🎒 MOCHILA / BOLSA</div>
        <div style={{ fontSize: '8px', color: '#FFD700' }}>
          {starter?.starter_nombre?.toUpperCase() || 'STARTER'} (NIV. {starter?.starter_nivel || starter?.level || 5})
        </div>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        gap: '12px',
        minHeight: '0',
        marginBottom: '10px'
      }}>
        {/* Item List */}
        <div style={{
          flex: 1.2,
          background: '#fff',
          border: '3px solid #000',
          borderRadius: '4px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto'
        }}>
          {BAG_ITEMS.map((item, idx) => {
            const itemCount = user?.inventario?.[item.id] ?? 0;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedIdx(idx);
                  setIsConfirming(false);
                  setDialogue(item.description);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: selectedIdx === idx ? '#FFD700' : 'transparent',
                  border: selectedIdx === idx ? '2px solid #000' : '2px solid transparent',
                  fontSize: '8px',
                  opacity: itemCount > 0 ? 1 : 0.5
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                <div style={{ fontWeight: 'bold' }}>x{itemCount}</div>
              </div>
            );
          })}
        </div>

        {/* Backpack Sprite Graphic View */}
        <div style={{
          flex: 0.8,
          background: '#fff',
          border: '3px solid #000',
          borderRadius: '4px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto 0' }}>
            <span style={{ fontSize: '48px', marginBottom: '8px', display: 'block', animation: 'bounce 1s infinite alternate' }}>🎒</span>
            <span style={{ fontSize: '8px', color: '#888' }}>BOLSA HABITMON</span>
          </div>

          <div style={{ width: '100%', borderTop: '2px dashed #ccc', paddingTop: '8px' }}>
            <div style={{ fontSize: '7px', display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
              <span>Objeto:</span>
              <span style={{ fontWeight: 'bold' }}>{selectedItem.icon} {selectedItem.name}</span>
            </div>
            <div style={{ fontSize: '7px', display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
              <span>Cantidad:</span>
              <span style={{ color: count > 0 ? '#4E538C' : '#FF0000', fontWeight: 'bold' }}>x{count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Action Area */}
      <div style={{
        background: '#fff',
        border: '4px solid #333',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '75px',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: 'inset -2px -2px 0px #ccc'
      }}>
        {/* Scroll dialogue text */}
        <div style={{
          fontSize: '7px',
          lineHeight: '1.6',
          color: '#111',
          paddingRight: '120px'
        }}>
          {dialogue}
        </div>

        {/* Buttons Pane */}
        <div style={{
          position: 'absolute',
          right: '8px',
          bottom: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '100px'
        }}>
          {!isConfirming ? (
            <>
              <button
                onClick={() => {
                  if (count <= 0) {
                    setDialogue('¡No tienes unidades de este objeto!');
                    return;
                  }
                  if (!selectedItem.usableOutside) {
                    setDialogue('Este objeto solo se puede usar durante batallas contra Pokémon salvajes.');
                    return;
                  }
                  setIsConfirming(true);
                  setDialogue(`¿Deseas usar ${selectedItem.name} en ${starter?.starter_nombre?.toUpperCase() || 'compañero'}?`);
                }}
                disabled={count <= 0}
                style={{
                  padding: '8px',
                  background: count > 0 ? '#FFD700' : '#ddd',
                  color: '#333',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '7px',
                  fontFamily: '"Press Start 2P"',
                  cursor: count > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  opacity: count > 0 ? 1 : 0.6
                }}
              >
                USAR
              </button>
              <button
                onClick={() => navigate('city')}
                style={{
                  padding: '6px',
                  background: '#ddd',
                  color: '#333',
                  border: '2px solid #333',
                  borderRadius: '4px',
                  fontSize: '7px',
                  fontFamily: '"Press Start 2P"',
                  cursor: 'pointer'
                }}
              >
                ATRÁS
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleUseItem}
                style={{
                  padding: '8px',
                  background: '#4CAF50',
                  color: '#fff',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '7px',
                  fontFamily: '"Press Start 2P"',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                SÍ
              </button>
              <button
                onClick={() => {
                  setIsConfirming(false);
                  setDialogue(selectedItem.description);
                }}
                style={{
                  padding: '6px',
                  background: '#f44336',
                  color: '#fff',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '7px',
                  fontFamily: '"Press Start 2P"',
                  cursor: 'pointer'
                }}
              >
                NO
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default BagScreen;
