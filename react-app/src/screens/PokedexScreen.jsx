import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { POKEMON_SPECIES } from '../data/pokemonData';
import { getAssetPath } from '../api';

const PokedexScreen = ({ navigate }) => {
  const { coleccion, starter } = useGame();
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Combinar starter y colección para obtener la lista de Pokémon obtenidos
  const obtainedList = [];
  if (starter && starter.starter_id) {
    obtainedList.push({
      pokemon_id: starter.starter_id,
      pokemon_nombre: starter.starter_nombre || 'Compañero',
      level: starter.starter_nivel || starter.level || 5
    });
  }

  (coleccion || []).forEach(pk => {
    if (!obtainedList.find(o => String(o.pokemon_id) === String(pk.pokemon_id))) {
      obtainedList.push(pk);
    }
  });

  const selectedPokemon = obtainedList[selectedIdx] || null;
  const speciesInfo = selectedPokemon ? POKEMON_SPECIES[String(selectedPokemon.pokemon_id).padStart(3, '0')] : null;

  return (
    <div className="retro-pokedex-container" style={{
      width: '100vw',
      height: '100dvh',
      background: '#D90000', // Rojo clásico Pokedex
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
        background: '#8B0000',
        color: '#fff',
        padding: '8px 12px',
        border: '3px solid #000',
        borderRadius: '4px',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '10px' }}>📖 POKÉDEX</div>
        <div style={{ fontSize: '8px', color: '#FFD700' }}>VISTOS: {obtainedList.length}</div>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        gap: '12px',
        minHeight: '0',
        marginBottom: '10px'
      }}>
        {/* Lado Izquierdo: Lista de Pokémon */}
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
          {obtainedList.length === 0 ? (
            <div style={{ fontSize: '8px', textAlign: 'center', marginTop: '20px' }}>No hay datos.</div>
          ) : (
            obtainedList.map((pk, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: selectedIdx === idx ? '#333' : 'transparent',
                  color: selectedIdx === idx ? '#fff' : '#333',
                  border: selectedIdx === idx ? '2px solid #000' : '2px solid transparent',
                  fontSize: '8px',
                }}
              >
                <span>No.{String(pk.pokemon_id).padStart(3, '0')}</span>
                <span>{pk.pokemon_nombre || speciesInfo?.name}</span>
              </div>
            ))
          )}
        </div>

        {/* Lado Derecho: Imagen y Detalles */}
        <div style={{
          flex: 0.8,
          background: '#98D8D8', // Color celeste de pantalla
          border: '3px solid #000',
          borderRadius: '4px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {selectedPokemon && speciesInfo ? (
            <>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: '#fff', 
                border: '2px solid #000', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                marginBottom: '8px',
                borderRadius: '4px'
              }}>
                <img 
                  src={getAssetPath(`/Graphics/battlers/${String(selectedPokemon.pokemon_id).padStart(3, '0')}.png`)} 
                  alt={speciesInfo.name}
                  style={{ width: '90%', height: '90%', objectFit: 'contain', imageRendering: 'pixelated' }}
                />
              </div>
              <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '8px' }}>
                {speciesInfo.name.toUpperCase()}
              </div>
              <div style={{ fontSize: '6px', marginBottom: '8px', background: '#333', color: '#fff', padding: '4px', borderRadius: '4px' }}>
                {speciesInfo.types.join(' / ')}
              </div>
              <div style={{ width: '100%', borderTop: '2px dashed #000', paddingTop: '8px', fontSize: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>PS:</span><span>{speciesInfo.baseStats.hp}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ATQ:</span><span>{speciesInfo.baseStats.atk}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>DEF:</span><span>{speciesInfo.baseStats.def}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>VEL:</span><span>{speciesInfo.baseStats.spe}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '8px', marginTop: '40px' }}>SIN DATOS</div>
          )}
        </div>
      </div>

      {/* Footer / Controles */}
      <div style={{
        background: '#fff',
        border: '4px solid #333',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'inset -2px -2px 0px #ccc'
      }}>
        <div style={{ fontSize: '7px', color: '#111' }}>
          DATOS DE LA POKÉDEX
        </div>
        <button
          onClick={() => navigate('city')}
          style={{
            padding: '8px 16px',
            background: '#ddd',
            color: '#333',
            border: '2px solid #333',
            borderRadius: '4px',
            fontSize: '7px',
            fontFamily: '"Press Start 2P"',
            cursor: 'pointer'
          }}
        >
          SALIR
        </button>
      </div>
    </div>
  );
};

export default PokedexScreen;
