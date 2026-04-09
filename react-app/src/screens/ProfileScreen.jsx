import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { SpriteAvatar } from '../components/GBSprite';


const ProfileScreen = ({ onNavigate }) => {
  const { user, progress, coleccion, logout, fetchColeccion, setPartner } = useGame();

  useEffect(() => {
    if (user) fetchColeccion(user.id);
  }, []);

  const medalsCount = progress?.gimnasios_completados?.length || 0;

  const avatarIdx = String(user?.avatar ?? 0).padStart(3, '0');

  return (
    <div className="profile-screen" style={screenStyle}>
      <h2 style={h2Style}>FICHA DE ENTRENADOR</h2>

      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={avatarBoxStyle}>
            <SpriteAvatar
              path={`Graphics/characters/trchar${avatarIdx}.png`}
              fallbackPath="Graphics/characters/trchar000.png"
              size={48}
              col={0}
              row={0}
            />
          </div>
          <div style={infoStyle}>
            <p>NOMBRE: {user?.username?.toUpperCase()}</p>
            <p>MEDALLAS: {medalsCount}/3</p>
            <p style={{ marginTop: '8px', fontSize: '6px', color: '#666' }}>ID: #{String(user?.id).padStart(5, '0')}</p>
          </div>
        </div>

        <div style={sectionTitleStyle}>🏆 COLECCIÓN & COMPAÑERO</div>
        <div style={collectionGridStyle}>
          {coleccion.length === 0 ? (
            <p style={emptyStyle}>Vence un gimnasio para capturar Pokémon.</p>
          ) : (
            coleccion.map((p, idx) => {
              const currentXp = p.xp || 0;
              const currentLevel = p.nivel || 5;
              const xpPercent = currentXp % 100;
              const isPartner = parseInt(p.is_partner) === 1;

              return (
                <div key={idx} style={{...pkCardStyle, borderColor: isPartner ? '#f39c12' : '#333'}}>
                  {isPartner && <div style={partnerBadge}>★ COMPAÑERO</div>}
                  <img
                    src={`Graphics/battlers/${String(p.pokemon_id).padStart(3, '0')}.png`}
                    style={pkImgStyle}
                    alt={p.pokemon_nombre}
                    onError={(e) => { e.target.src = `Graphics/pokemon/${String(p.pokemon_id).padStart(3, '0')}.png`; }}
                  />
                  <div style={pkInfoStyle}>
                    <span style={pkNameStyle}>{p.pokemon_nombre}</span>
                    <span style={pkLevelStyle}>Nv. {currentLevel}</span>
                  </div>
                  <div style={xpBarContainer}>
                     <div style={{...xpBarFill, width: `${xpPercent}%`}} />
                  </div>
                  {!isPartner && (
                     <button style={btnPartner} onClick={() => setPartner(p.id)}>ELEGIR</button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <button onClick={() => { logout(); onNavigate('LOGIN'); }} style={logoutStyle}>CERRAR SESIÓN</button>
    </div>
  );
};

const screenStyle = {
  width: '100%', height: '100%', backgroundColor: '#f0f0f0',
  padding: '16px 16px 60px', fontFamily: '"Press Start 2P"',
  display: 'flex', flexDirection: 'column', overflowY: 'auto',
  boxSizing: 'border-box',
};
const h2Style = { fontSize: 'clamp(10px, 3vw, 14px)', textAlign: 'center', marginBottom: '16px' };
const cardStyle = {
  flex: 1, backgroundColor: '#fff', border: '4px solid #333',
  padding: '12px', display: 'flex', flexDirection: 'column', minHeight: 0,
};
const headerStyle = {
  display: 'flex', gap: '12px', borderBottom: '2px solid #ccc',
  paddingBottom: '12px', marginBottom: '12px', alignItems: 'center',
};
const avatarBoxStyle = {
  width: '64px', height: '64px', flexShrink: 0,
  border: '3px solid #333', display: 'flex',
  justifyContent: 'center', alignItems: 'center',
  backgroundColor: '#eee',
  backgroundImage: 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%)',
};
const avatarImgStyle = { width: '32px', height: '32px', imageRendering: 'pixelated' };
const infoStyle = { fontSize: 'clamp(7px, 2vw, 10px)', lineHeight: '2em', flex: 1 };
const sectionTitleStyle = { fontSize: 'clamp(8px, 2.2vw, 10px)', marginBottom: '12px', textDecoration: 'underline' };
const collectionGridStyle = {
  display: 'grid', gridTemplateColumns: '1fr 1fr',
  gap: '8px', overflowY: 'auto', flex: 1,
};
const emptyStyle = {
  gridColumn: 'span 2', fontSize: 'clamp(6px, 1.8vw, 8px)',
  color: '#999', lineHeight: '1.6em', marginTop: '16px', textAlign: 'center',
};
const pkCardStyle = {
  border: '2px solid #333', padding: '8px',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '4px', backgroundColor: '#f9f9f9', position: 'relative',
};
const pkImgStyle = { width: '48px', height: '48px', imageRendering: 'pixelated' };
const pkInfoStyle = { display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '5px' };
const pkNameStyle = { fontWeight: 'bold' };
const pkLevelStyle = { color: '#2980b9' };

const xpBarContainer = {
  width: '100%', height: '4px', backgroundColor: '#ccc',
  border: '1px solid #666', marginTop: '2px', overflow: 'hidden'
};
const xpBarFill = { height: '100%', backgroundColor: '#4caf50' };

const partnerBadge = {
  position: 'absolute', top: -5, left: -5, backgroundColor: '#f39c12',
  color: '#fff', fontSize: '5px', padding: '2px 4px', border: '1px solid #333'
};
const btnPartner = {
  marginTop: '4px', fontSize: '5px', padding: '4px',
  backgroundColor: '#3048a8', color: '#fff', border: 'none',
  cursor: 'pointer', fontFamily: '"Press Start 2P"', width: '100%'
};

const logoutStyle = {
  marginTop: '12px', color: '#ff1111',
  fontSize: 'clamp(7px, 1.8vw, 9px)', background: 'none',
  border: 'none', cursor: 'pointer', textDecoration: 'underline',
  fontFamily: '"Press Start 2P"',
};

export default ProfileScreen;
