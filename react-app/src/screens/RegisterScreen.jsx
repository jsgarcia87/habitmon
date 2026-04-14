import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { getAssetPath } from '../api';

const RegisterScreen = ({ onLoginClick }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    avatar: 0
  });
  const [error, setError] = useState('');
  const { register } = useGame();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(formData.username, formData.email, formData.password, formData.avatar);
    if (!res.success) {
      setError(res.message || 'Error al registrarse');
    }
  };

  const avatars = [0, 1, 2, 3]; // Different trainer sprites

  return (
    <div className="screen-container">
      <div className="gb-window" style={{ marginTop: '20px' }}>
        <h2>NUEVO ENTRENADOR</h2>
        <form onSubmit={handleSubmit}>
          <div className="gb-input-group">
            <label className="gb-label">NOMBRE DE USUARIO</label>
            <input 
              className="gb-input" 
              type="text" 
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="RED"
              required 
            />
          </div>

          <div className="gb-input-group">
            <label className="gb-label">EMAIL</label>
            <input 
              className="gb-input" 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="red@paleta.com"
              required 
            />
          </div>

          <div className="gb-input-group">
            <label className="gb-label">CONTRASEÑA</label>
            <input 
              className="gb-input" 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
              required 
            />
          </div>

          <div className="gb-input-group">
            <label className="gb-label">ELIGE TU AVATAR</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {avatars.map(id => (
                <div 
                  key={id} 
                  onClick={() => setFormData({...formData, avatar: id})}
                  style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid ' + (formData.avatar === id ? 'var(--primary-color)' : '#ccc'),
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: formData.avatar === id ? '#eef' : '#fff',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  <img 
                    src={getAssetPath(`/Graphics/characters/trchar00${id}.png`)} 
                    alt={`Avatar ${id}`} 
                    style={{
                      width: '32px',
                      height: '32px',
                      imageRendering: 'pixelated',
                      objectFit: 'contain'
                    }}
                  />
                  <span style={{ fontSize: '8px', marginTop: '5px' }}>ID:{id}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ color: 'var(--secondary-color)', fontSize: '8px', marginBottom: '20px' }}>
              {error}
            </p>
          )}

          <button type="submit" className="gb-button primary" style={{ width: '100%', marginBottom: '10px' }}>
            REGISTRARME
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={onLoginClick} className="gb-button" style={{ fontSize: '8px' }}>
          ¿YA TIENES CUENTA? INICIA SESIÓN
        </button>
      </div>
    </div>
  );
};

export default RegisterScreen;
