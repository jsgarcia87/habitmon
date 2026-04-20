import React from 'react';
import { useGame } from '../context/GameContext';

const ProfileScreen = ({ onNavigate }) => {
  const { user, starter, coleccion, gimnasiosHoy, darkMode, toggleDarkMode } = useGame();
  
  return (
    <div style={{
      width:'100%', height:'100%',
      background:'var(--bg-color)', color:'var(--text-main)',
      fontFamily:'"Press Start 2P",monospace',
      display:'flex', flexDirection:'column',
      alignItems:'center', padding:'20px',
      overflowY:'auto', boxSizing:'border-box'
    }}>
      <h2 style={{fontSize:10,marginBottom:20,
                  color:'#FFD700'}}>
        FICHA ENTRENADOR
      </h2>

      {/* Dark Mode Toggle */}
      <div style={{ marginBottom: 20, width: '100%', maxWidth: 300 }}>
        <button 
          onClick={toggleDarkMode}
          style={{
            width: '100%', padding: '10px',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)',
            border: '3px solid var(--border-color)',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7, cursor: 'pointer'
          }}
        >
          {darkMode ? '☀️ MODO CLARO' : '🌙 MODO OSCURO'}
        </button>
      </div>

      {/* Avatar + nombre (CORREGIDO) */}
...

      <div style={{
        border:'3px solid #FFD700',
        padding:'20px', marginBottom:16,
        textAlign:'center', width:'100%',
        maxWidth:300, display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        <div style={{
          width: 32, height: 40,
          backgroundImage: `url(Graphics/characters/trchar00${user?.avatar||0}.png)`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0 0',
          imageRendering: 'pixelated',
          transform: 'scale(2)',
          marginBottom: 20,
          marginTop: 10
        }} />
        <p style={{fontSize:9, marginTop: 15}}>{user?.username}</p>
      </div>

      {/* Starter */}
      {starter?.starter_id && (
        <div style={{
          border:'2px solid #4080F0',
          padding:12, marginBottom:16,
          width:'100%', maxWidth:300
        }}>
          <p style={{fontSize:7,color:'#4080F0',
                     marginBottom:8}}>
            POKÉMON INICIAL
          </p>
          <div style={{display:'flex',
                       alignItems:'center',gap:12}}>
            <img
              src={`Graphics/battlers/${
                starter.starter_id}.png`}
              style={{imageRendering:'pixelated',
                      width:48}}
              onError={e=>e.target.style.display='none'}
            />
            <div>
              <p style={{fontSize:8}}>
                {starter.starter_nombre}
              </p>
              <p style={{fontSize:7,color:'#888'}}>
                Nv.{starter.starter_nivel}
              </p>
              <div style={{
                background:'#333',height:6,
                width:100,marginTop:4
              }}>
                <div style={{
                  background:'#4080F0',height:'100%',
                  width:`${Math.min(100,
                    (starter.starter_exp%100))}%`,
                  transition:'width 0.3s'
                }}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medallas */}
      <div style={{
        border:'2px solid #FFD700',
        padding:12, marginBottom:16,
        width:'100%', maxWidth:300
      }}>
        <p style={{fontSize:7,color:'#FFD700',
                   marginBottom:8}}>
          MEDALLAS HOY
        </p>
        <div style={{display:'flex',
                     flexWrap:'wrap',gap:8}}>
          {gimnasiosHoy?.filter(g=>g.completado)
            .map(g=>(
            <div key={g.gym_id} style={{
              background:'#FFD700',
              color:'#111',padding:'4px 8px',
              fontSize:6
            }}>
              🏅 {g.gym_id.toUpperCase()}
            </div>
          ))}
          {!gimnasiosHoy?.some(g=>g.completado) && (
            <p style={{fontSize:7,color:'#666'}}>
              Sin medallas hoy
            </p>
          )}
        </div>
      </div>

      {/* Colección */}
      <div style={{
        border:'2px solid #40C040',
        padding:12, width:'100%', maxWidth:300
      }}>
        <p style={{fontSize:7,color:'#40C040',
                   marginBottom:8}}>
          COLECCIÓN ({coleccion?.length||0})
        </p>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(4,1fr)',
          gap:8
        }}>
          {coleccion?.slice(0,12).map((p,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <img
                src={`Graphics/battlers/${p.pokemon_id}.png`}
                style={{imageRendering:'pixelated',
                        width:32}}
                onError={e=>e.target.style.display='none'}
              />
              <p style={{fontSize:5,color:'#aaa',
                         marginTop:2}}>
                {p.pokemon_nombre}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={()=>onNavigate('ADMIN')}
        style={{
          marginTop:12,padding:'10px 20px',
          background:'rgba(255,215,0,0.1)',
          color:'#FFD700',
          border:'2px solid #FFD700',
          fontFamily:'"Press Start 2P",monospace',
          fontSize:7,cursor:'pointer',
          width:'100%',maxWidth:300
        }}
      >
        ⚙️ CONFIGURAR HÁBITOS
      </button>


      <button
        onClick={()=>onNavigate('CITY')}
        style={{
          marginTop:20, padding:'12px 24px',
          background:'#E83030', color:'#fff',
          border:'3px solid #fff',
          fontFamily:'"Press Start 2P",monospace',
          fontSize:8, cursor:'pointer'
        }}
      >
        VOLVER
      </button>
    </div>
  );
};

export default ProfileScreen;
