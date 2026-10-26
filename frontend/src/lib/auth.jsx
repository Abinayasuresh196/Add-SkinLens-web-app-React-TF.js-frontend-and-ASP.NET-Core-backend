import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) { setReady(true); return; }
    api.me().then(setUser).catch(() => tokenStore.set(null)).finally(() => setReady(true));
  }, []);

  const finish = useCallback(async (tokenResponse) => {
    tokenStore.set(tokenResponse.accessToken);
    setUser(await api.me());
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    signIn: async (email, password) => finish(await api.login(email, password)),
    register: async (name, email, password) => finish(await api.register(name, email, password)),
    signOut: () => { tokenStore.set(null); setUser(null); },
  }), [user, ready, finish]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
