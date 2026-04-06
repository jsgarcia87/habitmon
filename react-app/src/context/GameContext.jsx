import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();
export const useGame = () => useContext(GameContext);

const API_BASE = 'api';

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 20) return 'day';
  return 'night';
};

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('habitmon_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('habitmon_token'));
  const [progress, setProgress] = useState(null);
  const [template, setTemplate] = useState(null);
  const [coleccion, setColeccion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay);

  // Auto-actualizar el tiempo del día cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getTimeOfDay();
      setTimeOfDay(prev => prev !== newTime ? newTime : prev);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auth Headers
  const getHeaders = (overrideToken) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${overrideToken || token}`
  });

  // Fetch today's progress
  const fetchProgress = async (userId, tokenOverride = null) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_BASE}/progreso/${userId}/${today}`, { 
        headers: getHeaders(tokenOverride) 
      });
      const data = await res.json();
      if (data.success) {
        setProgress(data);
      }
    } catch (e) {
      console.error("Error fetching progress", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchColeccion = async (userId, tokenOverride = null) => {
    const res = await fetch(`${API_BASE}/coleccion/${userId}`, { 
      headers: getHeaders(tokenOverride) 
    });
    const data = await res.json();
    if (data.success) setColeccion(data.pokemon);
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('habitmon_token', data.token);
      localStorage.setItem('habitmon_user', JSON.stringify(data.usuario));
      setToken(data.token);
      setUser(data.usuario);
      // Use the fresh token immediately
      await fetchProgress(data.usuario.id, data.token);
      await fetchColeccion(data.usuario.id, data.token);
      await fetchTemplate(data.token);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const register = async (username, email, password, avatar) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, avatar })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('habitmon_token', data.token);
      localStorage.setItem('habitmon_user', JSON.stringify(data.usuario));
      setToken(data.token);
      setUser(data.usuario);
      // Use the fresh token immediately
      await fetchProgress(data.usuario.id, data.token);
      await fetchColeccion(data.usuario.id, data.token);
      await fetchTemplate(data.token);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const logout = () => {
    localStorage.removeItem('habitmon_token');
    localStorage.removeItem('habitmon_user');
    setToken(null);
    setUser(null);
    setProgress(null);
  };

  const completeHabit = async (gymId, habitId) => {
    const res = await fetch(`${API_BASE}/habito/completar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ gimnasio_id: gymId, habito_id: habitId })
    });
    const data = await res.json();
    if (data.success) {
      await fetchProgress(user.id);
    }
    return data;
  };

  const completeGym = async (gymId, pokemonId, pokemonNombre) => {
     const res = await fetch(`${API_BASE}/gimnasio/completar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ gimnasio_id: gymId, pokemon_id: pokemonId, pokemon_nombre: pokemonNombre })
     });
     const data = await res.json();
     if (data.success) {
        await fetchProgress(user.id);
     }
     return data;
  };

  const setupDay = async (habitos) => {
    const res = await fetch(`${API_BASE}/progreso/setup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ habitos })
    });
    const data = await res.json();
    if (data.success) {
      await fetchProgress(user.id);
    }
    return data;
  };

  const fetchTemplate = async (tokenOverride = null) => {
    const res = await fetch(`${API_BASE}/habitos/template`, { 
      headers: getHeaders(tokenOverride) 
    });
    const data = await res.json();
    if (data.success) setTemplate(data.template);
  };

  useEffect(() => {
    if (token && user) {
      fetchProgress(user.id);
      fetchColeccion(user.id);
      fetchTemplate();
    }
  }, [token]);

  return (
    <GameContext.Provider value={{
      user, token, progress, template, coleccion, loading,
      timeOfDay, setTimeOfDay,
      login, register, logout, completeHabit, completeGym, setupDay, fetchTemplate, fetchColeccion
    }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;
