import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const LoginScreen = ({ onNavigate }) => {
  const { login } = useGame();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    // Context will update so App.jsx will redirect automatically
  };

  return (
    <div className="login-screen" style={screenStyle}>
      <div className="title-logo" style={titleStyle}>
        <h1 style={h1Style}>HABITMON</h1>
        <p style={pStyle}>EDICIÓN HÁBITOS</p>
      </div>

      <div className="auth-box" style={boxStyle}>
        <h2 style={h2Style}>ENTRAR</h2>
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroupStyle}>
             <label style={labelStyle}>EMAIL:</label>
             <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={inputStyle}
                required
             />
          </div>
          <div style={inputGroupStyle}>
             <label style={labelStyle}>PASSWORD:</label>
             <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={inputStyle}
                required
             />
          </div>
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" className="gb-button" style={buttonStyle}>ENTRAR</button>
        </form>
        <button onClick={() => onNavigate('REGISTER')} style={linkButtonStyle}>
            ¿No tienes cuenta? REGÍSTRATE
        </button>
      </div>
    </div>
  );
};

const screenStyle = {
  width: '100%', height: '100%',
  backgroundColor: '#f8f8f8',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  padding: 'clamp(20px, 5vw, 40px) 20px',
  fontFamily: '"Press Start 2P", cursive',
  overflowY: 'auto', boxSizing: 'border-box',
};

const titleStyle = { textAlign: 'center', marginBottom: 'clamp(16px, 4vw, 30px)' };
const h1Style = { fontSize: 'clamp(16px, 5vw, 24px)', color: '#3048a8', textShadow: '2px 2px #a0b0e0' };
const pStyle = { fontSize: 'clamp(8px, 2vw, 10px)', color: '#ff1111', marginTop: '5px' };

const boxStyle = {
  width: '100%', maxWidth: '320px',
  border: '4px solid #333',
  padding: 'clamp(14px, 3vw, 20px)',
  backgroundColor: '#fff',
  boxShadow: '4px 4px 0 #aaa',
};

const h2Style = { fontSize: 'clamp(10px, 3vw, 14px)', marginBottom: '16px', textAlign: 'center' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: 'clamp(7px, 1.8vw, 8px)' };
const inputStyle = {
  padding: '10px 8px',
  fontSize: 'clamp(9px, 2.2vw, 11px)',
  border: '2px solid #333',
  fontFamily: '"Press Start 2P"',
  width: '100%', boxSizing: 'border-box',
};
const errorStyle = { color: '#e40000', fontSize: '7px', textAlign: 'center', lineHeight: '1.5' };
const buttonStyle = {
  marginTop: '8px', padding: '12px',
  backgroundColor: '#3048a8', color: '#fff',
  border: '3px solid #1a2870',
  cursor: 'pointer',
  fontFamily: '"Press Start 2P"',
  fontSize: 'clamp(8px, 2vw, 10px)',
  boxShadow: '0 3px 0 #1a2870', width: '100%',
};
const linkButtonStyle = {
  marginTop: '14px',
  background: 'none', border: 'none',
  color: '#555', fontSize: 'clamp(6px, 1.6vw, 8px)',
  cursor: 'pointer', textDecoration: 'underline',
  fontFamily: '"Press Start 2P"',
  display: 'block', textAlign: 'center',
};

export default LoginScreen;
