import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SpriteAvatar } from '../components/GBSprite';

const RegisterScreen = ({ onNavigate }) => {
  const { register } = useGame();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const avatars = [
    { id: 0, img: 'Graphics/characters/trchar000.png', name: 'ROJO' },
    { id: 1, img: 'Graphics/characters/trchar001.png', name: 'AZUL' },
    { id: 2, img: 'Graphics/characters/trchar002.png', name: 'VERDE' },
    { id: 3, img: 'Graphics/characters/trchar003.png', name: 'AMARILLO' }
  ].map(av => ({ ...av, img: av.img.toLowerCase() }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.length < 3) return setError('NOMBRE DEMASIADO CORTO');
    if (password.length < 6) return setError('CONTRASEÑA MÍNIMO 6 CARACTERES');
    if (password !== confirmPassword) return setError('LAS CONTRASEÑAS NO COINCIDEN');
    
    setError(null);
    setLoading(true);
    const result = await register(username, email, password, avatar);
    setLoading(false);
    
    if (!result.success) {
      setError(result.error.toUpperCase());
    }
  };

  return (
    <div className="register-screen" style={screenStyle}>
      <div style={cardStyle}>
        <h2 style={h2Style}>NUEVO ENTRENADOR</h2>
        <p style={subStyle}>Regístrate para comenzar tu aventura</p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>NOMBRE DE USUARIO</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} placeholder="EJ. ASH" required />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>CORREO ELECTRÓNICO</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="EMAIL@POKEMON.COM" required />
          </div>

          <div style={rowStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>CONTRASEÑA</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>REPETIR</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} required />
            </div>
          </div>

          <div style={avatarSectionStyle}>
            <label style={labelStyle}>SELECCIONA TU AVATAR</label>
            <div style={avatarGridStyle}>
              {avatars.map(av => (
                <div 
                  key={av.id} 
                  onClick={() => setAvatar(av.id)}
                  style={{
                    ...avatarCardStyle,
                    borderColor: avatar === av.id ? '#e4000f' : '#ccc',
                    backgroundColor: avatar === av.id ? '#fff0f0' : '#fff',
                    boxShadow: avatar === av.id ? 'inset 0 0 10px rgba(228,0,15,0.2)' : 'none'
                  }}
                >
                  <SpriteAvatar
                    path={av.img}
                    fallbackPath="Graphics/characters/trchar000.png"
                    size={48}
                    col={0}
                    row={0}
                  />
                  <span style={{...avatarNameStyle, color: avatar === av.id ? '#e4000f' : '#666'}}>{av.name}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={errorBoxStyle}>{error}</div>}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'CREANDO...' : 'REGISTRARSE'}
          </button>
        </form>

        <button onClick={() => onNavigate('LOGIN')} style={linkButtonStyle}>
          ¿YA TIENES CUENTA? ENTRAR AQUÍ
        </button>
      </div>
    </div>
  );
};

// --- ESTILOS PREMIUM RETRO ---
const screenStyle = {
  width: '100%', height: '100%', backgroundColor: '#f0f0f0',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '20px', boxSizing: 'border-box', fontFamily: '"Press Start 2P"'
};

const cardStyle = {
  width: '100%', maxWidth: '400px', backgroundColor: '#fff',
  border: '4px solid #333', borderRadius: '8px', padding: '25px',
  boxShadow: '8px 8px 0 rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center'
};

const h2Style = { fontSize: '14px', color: '#e4000f', margin: '0 0 10px 0', textAlign: 'center' };
const subStyle = { fontSize: '8px', color: '#666', marginBottom: '25px', textAlign: 'center' };

const formStyle = { width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 };
const rowStyle = { display: 'flex', gap: '10px', width: '100%' };
const labelStyle = { fontSize: '7px', color: '#333', fontWeight: 'bold' };
const inputStyle = { 
  padding: '12px', fontSize: '9px', border: '3px solid #333', 
  fontFamily: '"Press Start 2P"', borderRadius: '4px', outline: 'none'
};

const avatarSectionStyle = { marginTop: '10px' };
const avatarGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '8px' };

const avatarCardStyle = {
  border: '3px solid', borderRadius: '6px', padding: '8px 0',
  cursor: 'pointer', display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '6px', transition: 'all 0.2s'
};

const spritePreviewStyle = {
  width: '32px', height: '48px', imageRendering: 'pixelated'
};

const avatarNameStyle = { fontSize: '6px', fontWeight: 'bold' };

const errorBoxStyle = { 
  backgroundColor: '#fff0f0', color: '#e4000f', padding: '10px', 
  border: '2px solid #e4000f', fontSize: '7px', textAlign: 'center' 
};

const buttonStyle = {
  padding: '18px', backgroundColor: '#3048a8', color: '#fff',
  border: 'none', borderBottom: '5px solid #203070', cursor: 'pointer',
  fontSize: '10px', marginTop: '10px', borderRadius: '4px',
  active: { transform: 'translateY(2px)', borderBottom: '2px solid #203070' }
};

const linkButtonStyle = {
  marginTop: '20px', background: 'none', border: 'none', color: '#3048a8',
  fontSize: '7px', cursor: 'pointer', textDecoration: 'underline'
};

export default RegisterScreen;
