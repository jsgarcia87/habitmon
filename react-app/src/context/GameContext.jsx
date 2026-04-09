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

  const saveCustomTemplate = (newTemplate) => {
    localStorage.setItem('habitmon_custom_template', JSON.stringify(newTemplate));
    setTemplate(newTemplate);
  };

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
    try {
      const res = await fetch(`${API_BASE}/coleccion/${userId}`, { 
        headers: getHeaders(tokenOverride) 
      });
      const data = await res.json();
      if (data.success) {
         setColeccion(data.pokemon);
         return;
      }
    } catch(e) {
      console.warn("Offline fetchColeccion");
    }
    const local = localStorage.getItem('habitmon_coleccion');
    if (local) setColeccion(JSON.parse(local));
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

  const register = async (username, email, password, avatar, starterId = 1, starterNombre = 'Bulbasaur') => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, avatar, starter_id: starterId, starter_nombre: starterNombre })
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

  const loginAsGuest = async () => {
    const guestUser = { id: 999, username: 'Invitado', email: 'guest@habitmon.local', avatar: 0 };
    localStorage.setItem('habitmon_user', JSON.stringify(guestUser));
    localStorage.setItem('habitmon_token', 'guest_token');
    setUser(guestUser);
    setToken('guest_token');
    
    // Load local template and progress
    await fetchTemplate('guest_token');
    return { success: true };
  };

  const chooseStarter = async (pokemonId, pokemonNombre) => {
    try {
      const res = await fetch(`${API_BASE}/auth/elegir-starter`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ pokemon_id: pokemonId, pokemon_nombre: pokemonNombre })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: `Error ${res.status}: ${errorText.substring(0, 50)}...` };
      }
      
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, pokemon_inicial_id: pokemonId, pokemon_inicial_nombre: pokemonNombre };
        setUser(updatedUser);
        localStorage.setItem('habitmon_user', JSON.stringify(updatedUser));
        await fetchColeccion(updatedUser.id, token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e) {
      return { success: false, error: "Fallo de red: " + e.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('habitmon_token');
    localStorage.removeItem('habitmon_user');
    setToken(null);
    setUser(null);
    setProgress(null);
  };

  const completeHabit = async (gymId, habitId) => {
    // Opitmistic update: change local state immediately
    if (progress && progress.habitos) {
      const updatedHabitos = progress.habitos.map(h => 
        (String(h.gym_id).trim() === String(gymId).trim() && String(h.habito_id).trim() === String(habitId).trim())
        ? { ...h, completado: true }
        : h
      );
      setProgress({ ...progress, habitos: updatedHabitos });
    }

    try {
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
    } catch (e) {
      console.warn("Offline completeHabit: keeping local progress", e);
      return { success: true, offline: true };
    }
  };

  const completeGym = async (gymId, pokemonId, pokemonNombre) => {
     // Optimistic update for medals
     if (progress && !progress.gimnasios_completados.includes(gymId)) {
        setProgress({
          ...progress,
          gimnasios_completados: [...progress.gimnasios_completados, gymId]
        });
     }
     
     // Optimistic collection adding
     const newColeccion = [...coleccion, { 
        id: 'tmp_' + Date.now(), 
        pokemon_id: pokemonId, 
        pokemon_nombre: pokemonNombre, 
        xp: 0, 
        nivel: 5,
        is_partner: coleccion.length === 0 ? 1 : 0 
     }];
     setColeccion(newColeccion);
     localStorage.setItem('habitmon_coleccion', JSON.stringify(newColeccion));

     try {
       const res = await fetch(`${API_BASE}/gimnasio/completar`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ gimnasio_id: gymId, pokemon_id: pokemonId, pokemon_nombre: pokemonNombre })
       });
       const data = await res.json();
       if (data.success) {
          await fetchProgress(user.id);
          await fetchColeccion(user.id); // refetch proper DB IDs
       }
       return data;
     } catch (e) {
       console.warn("Offline completeGym: keeping local progress", e);
       return { success: true, offline: true };
     }
  };

  const gainXP = async (amount, pokemonDbId = null) => {
     // Apply XP to partner if no specific ID given
     const partner = pokemonDbId 
       ? coleccion.find(p => p.id === pokemonDbId)
       : coleccion.find(p => parseInt(p.is_partner) === 1);
       
     if (!partner) return;
     
     const updated = coleccion.map(p => {
        if (p.id === partner.id) {
           const newXp = (p.xp || 0) + amount;
           const newLevel = Math.floor(newXp / 100) + 5;
           return { ...p, xp: newXp, nivel: newLevel };
        }
        return p;
     });
     
     setColeccion(updated);
     localStorage.setItem('habitmon_coleccion', JSON.stringify(updated));
     
     try {
       await fetch(`${API_BASE}/pokemon/gain_xp`, {
          method: 'POST', headers: getHeaders(),
          body: JSON.stringify({ pokemon_db_id: partner.id, amount })
       });
     } catch(e) {}
  };

  const setPartner = async (pokemonDbId) => {
     const updated = coleccion.map(p => ({
        ...p, is_partner: p.id === pokemonDbId ? 1 : 0
     }));
     setColeccion(updated);
     localStorage.setItem('habitmon_coleccion', JSON.stringify(updated));
     try {
       await fetch(`${API_BASE}/pokemon/set_partner`, {
          method: 'POST', headers: getHeaders(),
          body: JSON.stringify({ pokemon_db_id: pokemonDbId })
       });
     } catch(e) {}
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
    try {
      const res = await fetch(`${API_BASE}/habitos/template`, { 
        headers: getHeaders(tokenOverride) 
      });
      const data = await res.json();
      if (data.success) {
        setTemplate(data.template);
        return;
      }
    } catch (e) {
      console.warn("Falling back to local gamedata.json", e);
    }

    // Local Fallback
    try {
      // Intentar cargar la plantilla personalizada del localStorage primero (CRUD override)
      const customStore = localStorage.getItem('habitmon_custom_template');
      if (customStore) {
        try {
          const parsedCustom = JSON.parse(customStore);
          setTemplate(parsedCustom);
          
          if (!progress) {
             const hList = parsedCustom.flatMap(g => 
                (g.pokemon?.[0]?.habitos || g.habitos || []).map(h => ({
                  ...h, 
                  gym_id: g.gym_id, 
                  completado: false, 
                  pokemon_index: 0
                }))
             );
             setProgress({
               id_usuario: user?.id || 999,
               fecha: new Date().toISOString().split('T')[0],
               habitos: hList,
               gimnasios_completados: []
             });
          }
          return;
        } catch(e) { console.error("Error parsing custom template", e); }
      }

      const res = await fetch('Data/gamedata.json');
      const data = await res.json();
      
      // Adapt structure: local use "gimnasios", API uses "template"
      const rawGimnasios = data.gimnasios || data.template || data || [];
      
      if (Array.isArray(rawGimnasios)) {
        // Map local fields to app fields (rutina -> habitos, daño -> damage)
        const normalizedTemplate = rawGimnasios.map(g => ({
          ...g,
          gym_id: g.id || g.gym_id,
          gym_nombre: g.nombre || g.gym_nombre,
          pokemon: [{
            id: String(g.lider?.battler_img || '143').split('/').pop().split('.')[0] || '143',
            nombre: g.lider?.nombre || "Rival",
            maxhp: g.lider?.maxhp || 100,
            nivel: g.lider?.nivel || 5,
            habitos: (g.rutina || g.habitos || []).map(h => ({
              ...h,
              id: String(h.id),
              nombre: String(h.nombre),
              daño: Number(h.daño || h.damage || 20),
              icono: h.icono || '⚔️'
            }))
          }],
          // Mantenemos habitos para retrocompatibilidad
          habitos: (g.rutina || g.habitos || []).map(h => ({
            ...h,
            id: String(h.id),
            nombre: String(h.nombre),
            daño: Number(h.daño || h.damage || 20),
            icono: h.icono || '⚔️'
          }))
        }));

        setTemplate(normalizedTemplate);
        
        // Initialize progress if empty and we have a user (guest or real)
        if (!progress) {
          const hList = normalizedTemplate.flatMap(g => 
            (g.habitos || []).map(h => ({
              ...h, 
              gym_id: g.gym_id, 
              completado: false, 
              pokemon_index: (g.lider?.battler_img) ? 0 : -1 // Simplified for guest
            }))
          );
          setProgress({
            id_usuario: user?.id || 999,
            fecha: new Date().toISOString().split('T')[0],
            habitos: hList,
            gimnasios_completados: []
          });
        }
      } else {
        console.error("Critical: Template data is not an array", rawGimnasios);
      }
    } catch (err) {
      console.error("Critical: No template data found", err);
    }
  };

  useEffect(() => {
    // We always fetch the template (it will fall back to local JSON if the API fails or no token exists)
    fetchTemplate();

    if (token && user) {
      fetchProgress(user.id);
      fetchColeccion(user.id);
    }
  }, [token]);

  return (
    <GameContext.Provider value={{
      user, token, progress, template, coleccion, loading,
      timeOfDay, setTimeOfDay,
      login, register, loginAsGuest, logout, completeHabit, completeGym, setupDay, fetchTemplate, fetchColeccion,
      chooseStarter, fetchProgress,
      saveCustomTemplate, gainXP, setPartner
    }}>
      {children}
    </GameContext.Provider>
  );
};

// export default GameProvider; // Removed default export to match named import in App.jsx
