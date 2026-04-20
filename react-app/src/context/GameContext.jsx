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
      const [s, h, g, c] = await Promise.all([
        api.getStarter(),
        api.getHabitosHoy(),
        api.getGimnasiosHoy(),
        api.getColeccion()
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

      if(s?.success) {
        setStarter(s.starter || s);
        // Sync user state if starter was found on server but missing locally
        const serverStarterId = s.starter?.pokemon_id || s.starter_id || s.pokemon_id;
        if (serverStarterId && !user?.starter_id) {
            const updatedUser = { ...user, starter_id: serverStarterId };
            localStorage.setItem('hm_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        }
      }
      if(h?.success) setHabitosHoy(h.habitos || []);
      if(g?.success) setGimnasiosHoy(g.gimnasios || []);
      if(c?.success) setColeccion(c.pokemon || []);
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const completarHabito = async (gym_id, habito_id) => {
    const r = await api.completarHabito(
      {gym_id, habito_id});
    if(r.success) {
      // Actualizar estado local inmediatamente
      setHabitosHoy(prev => prev.map(h =>
        h.gym_id === gym_id && h.habito_id === habito_id
          ? {...h, completado: true} : h
      ));
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

  const saveCustomTemplate = async (newTemplate) => {
    const r = await api.saveAdminConfig(newTemplate);
    if(r.success) {
      setTemplate(newTemplate);
      await cargarDatos(); // Refresh today's habits
    }
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


  useEffect(() => {
    if(token) {
      cargarDatos();
    }
  }, [token, cargarDatos]);

  return (
    <Ctx.Provider value={{
      user, token, starter, habitosHoy,
      template, fetchTemplate, saveCustomTemplate,
      gimnasiosHoy, coleccion, loading, notification, darkMode,
      login, register, logout, notify, toggleDarkMode,
      elegirStarter, completarHabito, resetHabitos,
      completarGimnasio, cargarDatos, capturarPokemon
    }}>
      {children}
    </Ctx.Provider>
  );
};
