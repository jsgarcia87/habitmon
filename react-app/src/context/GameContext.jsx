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
  const [token, setToken]     = useState(
    () => localStorage.getItem('hm_token'));
  const [starter, setStarter] = useState(null);
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
    if(!token) return;
    setLoading(true);
    try {
      const results = await Promise.all([
        api.getStarter(),
        api.getHabitosHoy(),
        api.getGimnasiosHoy(),
        api.getColeccion()
      ]);

      // Check for unauthorized access in any response
      if (results.some(r => r.msg === 'Token is missing!' || r.msg === 'Token is invalid!')) {
        logout();
        return;
      }

      const [s, h, g, c] = results;
      if(s.success) setStarter(s.starter);
      if(h.success) setHabitosHoy(h.habitos);
      if(g.success) setGimnasiosHoy(g.gimnasios);
      if(c.success) setColeccion(c.pokemon);
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

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

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <Ctx.Provider value={{
      user, token, starter, habitosHoy,
      gimnasiosHoy, coleccion, loading,
      login, register, logout,
      elegirStarter, completarHabito,
      completarGimnasio, cargarDatos
    }}>
      {children}
    </Ctx.Provider>
  );
};
