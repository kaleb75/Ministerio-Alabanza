import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authenticate, saveSession, restoreSession, clearSession } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = restoreSession();
    if (saved) setUser(saved);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const authUser = authenticate(email, password);
    if (!authUser) throw new Error('Credenciales incorrectas');
    saveSession(authUser);
    setUser(authUser);
    return authUser;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export default AuthContext;
