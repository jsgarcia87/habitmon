import React, {createContext,useContext,
  useState,useEffect,useCallback} from 'react';
import {api} from '../api';

const Ctx = createContext();
export const useGame = () => useContext(Ctx);

export const GameProvider = ({children}) => {
  const [user, setUser]       = useState(() => {
    const s = localStorage.getItem('hm_user');
    return s ? JSON.parse(s) : null;
  });
  const [token, setToken]     = useState(() => localStorage.getItem('hm_token'));
  const [starter, setStarter] = useState(null);
  const [template, setTemplate] = useState(null);
  const [habitosHoy, setHabitosHoy] = useState([]);
  const [gimnasiosHoy, setGimnasiosHoy] = useState([]);
  const [coleccion, setColeccion] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null); 
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('hm_theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('hm_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const notify = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const saveAuth = (token, usuario) => {
    localStorage.setItem('hm_token', token);
    localStorage.setItem('hm_user', JSON.stringify(usuario));
    setToken(token);
    setUser(usuario);
  };

  const logout = () => {
    localStorage.removeItem('hm_token');
    localStorage.removeItem('hm_user');
    setToken(null);
    setUser(null);
    setStarter(null);
  };

  const login = async (email, password) => {
    const r = await api.login({email, password});
    if(r.success) saveAuth(r.token, r.usuario);
    return r;
  };

  const register = async (username, email, password, avatar) => {
    const r = await api.register(
      {username, email, password, avatar});
    if(r.success) saveAuth(r.token, r.usuario);
    return r;
  };

  const elegirStarter = async (pokemon_id, pokemon_nombre) => {
    const r = await api.elegirStarter(
      {pokemon_id, pokemon_nombre});
    if(r.success) {
      const updatedUser = {
        ...user, 
        starter_id: pokemon_id,
        starter_nombre: pokemon_nombre
      };
      localStorage.setItem('hm_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      await cargarDatos();
    }
    return r;
  };

  const cargarDatos = useCallback(async () => {
    const tok = localStorage.getItem('hm_token');
    console.log('Token en localStorage:', tok ? 
      tok.substring(0,20)+'...' : 'NULL');
    if(!tok) return;
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tok}`
      };
      const [s, h, g, c, statsRes] = await Promise.all([
        api.getStarter(),
        api.getHabitosHoy(),
        api.getGimnasiosHoy(),
        api.getColeccion(),
        api.getStats()
      ]);
      
      // Check for unauthorized access in any response
      const results = [s, h, g, c];
      const allUnauthorized = results.every(r => 
        !r?.success && (
          // Backend might return msg or error
          [r?.msg, r?.error].some(m => 
            m?.includes('Missing') || 
            m?.includes('Expired') || 
            m?.includes('Invalid') ||
            m?.includes('expirado') ||
            m?.includes('inválido')
          )
        )
      );


      if (allUnauthorized) {
        console.warn('Sesión expirada');
        logout();
        return;
      }

      console.log('API Results:', { starter: s, habitos: h, stats: statsRes });

      if(s?.success) {
        const data = s.starter || s;
        console.log('Starter Data found:', data);
        setStarter({
          ...data,
          // Normalización para consistencia interna (usamos los nombres del backend directamente)
          starter_id: data.starter_id || data.pokemon_id,
          starter_nombre: data.starter_nombre || data.pokemon_nombre,
          starter_nivel: data.starter_nivel || data.nivel || 5,
          starter_exp: data.starter_exp || data.xp || 0
        });
        
        // Sync user state if starter was found on server but missing locally
        const serverStarterId = data.starter_id || data.pokemon_id;
        if (serverStarterId && (!user || !user.starter_id)) {
            console.log('Syncing user starter_id from server:', serverStarterId);
            const updatedUser = { ...(user || {}), starter_id: serverStarterId };
            localStorage.setItem('hm_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
      } else {
        console.warn('Starter API returned failure:', s);
      }
      if(h?.success) setHabitosHoy(h.habitos || []);
      if(g?.success) setGimnasiosHoy(g.gimnasios || []);
      if(c?.success) setColeccion(c.pokemon || []);
      if(statsRes?.success) setStats(statsRes);
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      // Solo quitamos loading si ya terminó todo, para evitar parpadeos
      setLoading(false);
    }
  }, [user]); // Añadir user como dependencia para que el sync funcione correctamente

  const completarHabito = async (gym_id, habito_id) => {
    const r = await api.completarHabito(
      {gym_id, habito_id});
    if(r.success) {
      // Actualizar estado local inmediatamente
      setHabitosHoy(prev => prev.map(h => {
        const hId = h.habito_id || h.id;
        return (h.gym_id === gym_id && hId === habito_id)
          ? {...h, completado: true} : h
      }));

      // Actualizar progreso del starter si viene en la respuesta
      if (r.new_xp !== undefined) {
        setStarter(prev => ({
          ...prev,
          xp: r.new_xp,
          nivel: r.new_level,
          starter_nivel: r.new_level
        }));
      }
    }
    return r;
  };

  const completarGimnasio = async (gym_id, pk_id, pk_nombre) => {
    const r = await api.completarGimnasio(
      {gym_id, pokemon_id:pk_id, pokemon_nombre:pk_nombre});
    if(r.success) await cargarDatos();
    return r;
  };

  const resetHabitos = async () => {
    const r = await api.resetHabitosHoy();
    if(r.success) await cargarDatos();
    return r;
  };

  const fetchTemplate = useCallback(async () => {
    const r = await api.getAdminConfig();
    if(r.success) setTemplate(r.config);
  }, []);

  const fetchPresets = useCallback(async () => {
    const r = await api.getPresets();
    return r.success ? r.presets : [];
  }, []);

  const createPreset = async (nombre, config) => {
    const r = await api.savePreset({ nombre, config });
    return r;
  };

  const deletePreset = async (id) => {
    const r = await api.deletePreset(id);
    return r;
  };

  const saveCustomTemplate = async (newTemplate) => {
    try {
      const r = await api.saveAdminConfig(newTemplate);
      if(r.success) {
        setTemplate(newTemplate);
        await cargarDatos(); // Refresh today's habits
      }
      return r;
    } catch (e) {
      console.error("Save template error:", e);
      return { success: false, error: e.message };
    }
  };

  const setupDay = async (updatedTemplate) => {
    setLoading(true);
    const r = await saveCustomTemplate(updatedTemplate);
    setLoading(false);
    return r;
  };

  const capturarPokemon = async (pk_id, pk_nombre) => {
    try {
      const r = await api.capturarPokemon({ pokemon_id: pk_id, pokemon_nombre: pk_nombre });
      if (r.success) {
        await cargarDatos(); 
      } else {
        // Fallback local en caso de error de servidor
        setColeccion(prev => [...prev, { pokemon_id: pk_id, pokemon_nombre: pk_nombre }]);
      }
      return r;
    } catch (e) {
      console.error("Capture API failed, falling back to local state:", e);
      setColeccion(prev => [...prev, { pokemon_id: pk_id, pokemon_nombre: pk_nombre }]);
      return { success: true, localOnly: true };
    }
  };

  const ganarBatalla = async () => {
    const r = await api.ganarBatalla();
    if (r.success) {
      setStarter(prev => ({
        ...prev,
        starter_exp: r.new_xp !== undefined ? r.new_xp : prev.starter_exp,
        starter_nivel: r.new_level !== undefined ? r.new_level : prev.starter_nivel,
        nivel: r.new_level !== undefined ? r.new_level : prev.nivel,
        xp: r.new_xp !== undefined ? r.new_xp : prev.xp
      }));
    }
    return r;
  };

  useEffect(() => {
    if(token) {
      // Si no tenemos user heredado de localStorage, forzamos loading inicial
      if (!user) setLoading(true);
      cargarDatos();
    }
  }, [token, cargarDatos]);

  return (
    <Ctx.Provider value={{
      user, token, starter, habitosHoy,
      template, fetchTemplate, saveCustomTemplate, fetchPresets, createPreset,
      gimnasiosHoy, coleccion, loading, notification, darkMode,
      login, register, logout, notify, toggleDarkMode,
      elegirStarter, completarHabito, resetHabitos, setupDay, deletePreset,
      completarGimnasio, cargarDatos, capturarPokemon, ganarBatalla
    }}>
      {children}
    </Ctx.Provider>
  );
};
