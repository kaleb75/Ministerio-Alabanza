import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authenticate, saveSession, restoreSession, clearSession } from '../services/authService';
import { getById } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = restoreSession();
    if (!saved) { setIsLoading(false); return; }

    getById(saved.id)
      .then((fresh) => {
        if (!fresh || fresh.active === false) {
          clearSession();
        } else {
          const { password: _pw, ...safeUser } = fresh;
          setUser(safeUser);
        }
      })
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const authUser = await authenticate(email, password);
    if (!authUser) throw new Error('Credenciales incorrectas');
    saveSession(authUser);
    setUser(authUser);
    return authUser;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const hasRole = useCallback((roleOrRoles) => {
    if (!user) return false;
    const check = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    const userRoles = Array.isArray(user.roles) && user.roles.length > 0
      ? user.roles
      : (user.role ? [user.role] : []);
    return check.some((r) => userRoles.includes(r));
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
