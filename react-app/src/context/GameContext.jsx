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
  const [racha, setRacha] = useState(() => parseInt(localStorage.getItem('hm_racha') || '0'));
  // Franjas alineadas con Pokémon Crystal:
  //   MORN 04:00-09:59  → tileset/suffix "morning"
  //   DAY  10:00-17:59  → tileset/suffix "day"   (incluye "midday" interno
  //                       para la lógica de gimnasios de Habitmon)
  //   NITE 18:00-03:59  → tileset/suffix "nite"
  // El "midday" se mantiene como sub-franja DE día (11-15) para no romper
  // los gimnasios cuya tabla `tiempo` distingue mañana/tarde.
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 4  && hour < 10) return 'morning';
    if (hour >= 11 && hour < 15) return 'midday';
    if (hour >= 10 && hour < 18) return 'day';
    return 'night';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('hm_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Update timeOfDay every minute so it stays accurate across long sessions
  useEffect(() => {
    const getTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 4  && hour < 10) return 'morning';
      if (hour >= 11 && hour < 15) return 'midday';
      if (hour >= 10 && hour < 18) return 'day';
      return 'night';
    };
    const id = setInterval(() => setTimeOfDay(getTimeOfDay()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  const login = async (identifier, password) => {
    const r = await api.login({identifier, password});
    if(r.success) saveAuth(r.token, r.usuario);
    return r;
  };

  const register = async (username, email, password, avatar) => {
    const r = await api.register(
      {username, email, password, avatar});
    if(r.success) saveAuth(r.token, r.usuario);
    return r;
  };

  // Registro de cuenta tipo Profesor (Modo Profesor). Tras crearla queda
  // logueado automáticamente. Devuelve la respuesta cruda para que la UI
  // pueda mostrar errores específicos.
  const registerProfesor = async (username, email, password) => {
    const r = await api.registerProfesor({ username, email, password });
    if (r.success) saveAuth(r.token, r.usuario);
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
      
      // Si cualquier endpoint devuelve 401, el token es inválido → forzar re-login
      if ([s, h, g, c].some(r => r?._unauthorized)) {
        console.warn('Token inválido o expirado — cerrando sesión');
        logout();
        return;
      }

      if(s?.success) {
        const data = s.starter || s;
        setStarter({
          ...data,
          starter_id: data.starter_id || data.pokemon_id,
          starter_nombre: data.starter_nombre || data.pokemon_nombre,
          starter_nivel: data.starter_nivel || data.nivel || 5,
          starter_exp: data.starter_exp || data.xp || 0
        });

        const serverStarterId = data.starter_id || data.pokemon_id;
        if (serverStarterId && (!user || !user.starter_id)) {
            const updatedUser = { ...(user || {}), starter_id: serverStarterId };
            localStorage.setItem('hm_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
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

      // Actualizar monedas e inventario
      if (r.monedas !== undefined) {
        setUser(prev => {
          const updated = { ...prev, monedas: r.monedas, inventario: r.inventario || prev?.inventario };
          localStorage.setItem('hm_user', JSON.stringify(updated));
          return updated;
        });
      }
    }
    return r;
  };

  const completarGimnasio = async (gym_id, pk_id, pk_nombre) => {
    const r = await api.completarGimnasio(
      {gym_id, pokemon_id:pk_id, pokemon_nombre:pk_nombre});
    if(r.success) {
      if (r.total_monedas !== undefined || r.monedas !== undefined) {
        setUser(prev => {
          const updated = { ...prev, monedas: r.total_monedas !== undefined ? r.total_monedas : r.monedas, inventario: r.inventario || prev?.inventario };
          localStorage.setItem('hm_user', JSON.stringify(updated));
          return updated;
        });
      }
      await cargarDatos();
    }
    return r;
  };

  const resetHabitos = async () => {
    const r = await api.resetHabitosHoy();
    if (r?._unauthorized) { logout(); return r; }
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
      if (r?._unauthorized) { logout(); return r; }
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

  const capturarPokemon = async (pk_id, pk_nombre, ball_type = 'pokeball') => {
    try {
      const r = await api.capturarPokemon({ pokemon_id: pk_id, pokemon_nombre: pk_nombre, ball_type });
      if (r.success) {
        if (r.monedas !== undefined) {
          setUser(prev => {
            const updated = { ...prev, monedas: r.monedas, inventario: r.inventario || prev?.inventario };
            localStorage.setItem('hm_user', JSON.stringify(updated));
            return updated;
          });
        }
        await cargarDatos();
      }
      return r;
    } catch (e) {
      console.error("Capture API failed:", e);
      return { success: false, error: e.message };
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
      if (r.monedas !== undefined) {
        setUser(prev => {
          const updated = { ...prev, monedas: r.monedas, inventario: r.inventario || prev?.inventario };
          localStorage.setItem('hm_user', JSON.stringify(updated));
          return updated;
        });
      }
    }
    return r;
  };

  const comprarObjeto = async (item_id, cantidad) => {
    try {
      const r = await api.comprarObjeto({ item_id, cantidad });
      if (r.success) {
        setUser(prev => {
          const updated = { ...prev, monedas: r.monedas, inventario: r.inventario };
          localStorage.setItem('hm_user', JSON.stringify(updated));
          return updated;
        });
      }
      return r;
    } catch (e) {
      console.error("comprarObjeto error:", e);
      return { success: false, message: e.message };
    }
  };

  const usarObjeto = async (item_id) => {
    try {
      const r = await api.usarObjeto({ item_id });
      if (r.success) {
        setUser(prev => {
          const updated = { ...prev, inventario: r.inventario };
          localStorage.setItem('hm_user', JSON.stringify(updated));
          return updated;
        });
      }
      return r;
    } catch (e) {
      console.error("usarObjeto error:", e);
      return { success: false, message: e.message };
    }
  };

  const evolucionar = async (fromId, toId, toName) => {
    try {
      const r = await api.evolucionar({ from_id: fromId, to_id: toId, to_name: toName });
      if (r.success) {
        setStarter(prev => ({ ...prev, starter_id: toId, pokemon_id: toId, starter_nombre: toName, pokemon_nombre: toName }));
        setUser(prev => {
          const updated = { ...prev, starter_id: toId, starter_nombre: toName };
          localStorage.setItem('hm_user', JSON.stringify(updated));
          return updated;
        });
      }
      return r;
    } catch (e) {
      console.error("evolucionar error:", e);
      return { success: false, message: e.message };
    }
  };

  const configurarEncuentros = async (permitir_encuentros) => {
    try {
      const r = await api.configurarEncuentros({ permitir_encuentros });
      if (r.success) {
        setUser(prev => {
          const updated = { ...prev, permitir_encuentros: r.permitir_encuentros };
          localStorage.setItem('hm_user', JSON.stringify(updated));
          return updated;
        });
      }
      return r;
    } catch (e) {
      console.error("configurarEncuentros error:", e);
      return { success: false, message: e.message };
    }
  };

  // Streak: update when all habits for today are completed
  useEffect(() => {
    if (!habitosHoy || habitosHoy.length === 0) return;
    if (!habitosHoy.every(h => h.completado)) return;
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('hm_racha_date');
    if (lastDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const prev = parseInt(localStorage.getItem('hm_racha') || '0');
    const next = lastDate === yesterday ? prev + 1 : 1;
    localStorage.setItem('hm_racha', String(next));
    localStorage.setItem('hm_racha_date', today);
    setRacha(next);
  }, [habitosHoy]);

  useEffect(() => {
    if(token) {
      if (!user) setLoading(true);
      cargarDatos();
    }
  }, [token, cargarDatos]);

  return (
    <Ctx.Provider value={{
      user, token, starter, habitosHoy, racha,
      template, fetchTemplate, saveCustomTemplate, fetchPresets, createPreset,
      gimnasiosHoy, coleccion, loading, notification, darkMode, timeOfDay, setTimeOfDay,
      login, register, registerProfesor, logout, notify, toggleDarkMode,
      elegirStarter, completarHabito, resetHabitos, setupDay, deletePreset,
      completarGimnasio, cargarDatos, capturarPokemon, ganarBatalla,
      comprarObjeto, usarObjeto, configurarEncuentros, evolucionar
    }}>
      {children}
    </Ctx.Provider>
  );
};
