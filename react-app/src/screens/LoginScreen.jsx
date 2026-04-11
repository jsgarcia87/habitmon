import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const LoginScreen = ({ onRegisterClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useGame();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="screen-container">
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '40px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--primary-color)' }}>HABITMON</h1>
        <p style={{ fontSize: '8px' }}>Gotta Catch 'em All (Habits)!</p>
      </div>

      <div className="gb-window">
        <h2>INICIAR SESIÓN</h2>
        <form onSubmit={handleSubmit}>
          <div className="gb-input-group">
            <label className="gb-label">EMAIL</label>
            <input 
              className="gb-input" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prof.oak@kanto.com"
              required 
            />
          </div>

          <div className="gb-input-group">
            <label className="gb-label">CONTRASEÑA</label>
            <input 
              className="gb-input" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>

          {error && (
            <p style={{ color: 'var(--secondary-color)', fontSize: '8px', marginBottom: '20px' }}>
              {error}
            </p>
          )}

          <button type="submit" className="gb-button primary" style={{ width: '100%', marginBottom: '10px' }}>
            ENTRAR
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={onRegisterClick} className="gb-button" style={{ fontSize: '8px' }}>
          ¿NUEVO ENTRENADOR? REGÍSTRATE
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
