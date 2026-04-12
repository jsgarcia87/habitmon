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
      setUser(u => ({...u, starter_id: pokemon_id,
                          starter_nombre: pokemon_nombre}));
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
      const [s, h, g, c] = await Promise.all([
        fetch('/api/starter/info', {headers}).then(r=>r.json()),
        fetch('/api/habitos/hoy', {headers}).then(r=>r.json()),
        fetch('/api/gimnasios/hoy', {headers}).then(r=>r.json()),
        fetch('/api/coleccion', {headers}).then(r=>r.json())
      ]);
      
      // Check for unauthorized access in any response
      const results = [s, h, g, c];
      const allUnauthorized = results.every(r => 
        !r?.success && (
          r?.msg?.includes('Missing') ||
          r?.msg?.includes('Expired') ||
          r?.msg?.includes('Invalid') ||
          r?.msg?.includes('revoked')
        )
      );

      if (allUnauthorized) {
        console.warn('Sesión expirada');
        logout();
        return;
      }

      if(s?.success) setStarter(s.starter || s);
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
      gimnasiosHoy, coleccion, loading,
      login, register, logout,
      elegirStarter, completarHabito,
      completarGimnasio, cargarDatos, capturarPokemon
    }}>
      {children}
    </Ctx.Provider>
  );
};
