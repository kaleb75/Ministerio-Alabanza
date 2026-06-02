import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Music, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import mockRoles from '../../data/mockRoles.json';
import './Login.css';

const DEMO_USERS = [
  { email: 'admin@iglesia.com',    name: 'Admin',   role: 'admin' },
  { email: 'charlie@iglesia.com',  name: 'Charlie', role: 'lider_directores' },
  { email: 'director@iglesia.com', name: 'María',   role: 'director' },
  { email: 'musico@iglesia.com',   name: 'Luis',    role: 'musico' },
];

const ROLE_COLORS = {
  admin:            { bg: 'rgba(255,149,0,0.15)',   text: '#FF9500' },
  lider_directores: { bg: 'rgba(10,132,255,0.15)',  text: '#0A84FF' },
  director:         { bg: 'rgba(50,215,75,0.15)',   text: '#32D74B' },
  musico:           { bg: 'rgba(142,142,147,0.15)', text: '#8E8E93' },
};

export default function Login() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const from         = location.state?.from?.pathname ?? ROUTES.DASHBOARD;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Por favor ingresa tus credenciales'); return; }
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (u) => { setEmail(u.email); setPassword('123456'); setError(''); };

  return (
    <div className="login">
      <div className="login__header">
        <div className="login__logo-wrap">
          <Music size={28} />
        </div>
        <h1 className="login__title">Ministerio de Alabanza</h1>
        <p className="login__subtitle">Inicia sesión para continuar</p>
      </div>

      <form className="login__form" onSubmit={handleSubmit} noValidate>
        <div className="login__field">
          <label className="login__label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className={`login__input${error ? ' login__input--error' : ''}`}
            placeholder="tu@iglesia.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="login__field">
          <label className="login__label" htmlFor="login-password">Contraseña</label>
          <div className="login__pw-wrap">
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              className={`login__input login__input--pw${error ? ' login__input--error' : ''}`}
              placeholder="••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login__pw-toggle"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Ocultar' : 'Mostrar'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="login__error animate-fade-in-down" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="login__submit" disabled={isLoading}>
          {isLoading
            ? <span className="login__spinner" />
            : <><LogIn size={16} />Iniciar Sesión</>
          }
        </button>
      </form>

      <div className="login__demo">
        <div className="login__demo-label">Usuarios de demostración</div>
        <div className="login__demo-grid">
          {DEMO_USERS.map((u) => {
            const c = ROLE_COLORS[u.role];
            const roleLabel = mockRoles[u.role]?.label;
            return (
              <button
                key={u.email}
                type="button"
                className={`login__demo-btn${email === u.email ? ' login__demo-btn--active' : ''}`}
                onClick={() => fillDemo(u)}
              >
                <div
                  className="login__demo-avatar"
                  style={{ background: c?.bg, color: c?.text }}
                >
                  {u.name.charAt(0)}
                </div>
                <div className="login__demo-meta">
                  <span className="login__demo-name">{u.name}</span>
                  <span className="login__demo-role">{roleLabel}</span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="login__demo-hint">Contraseña: <code>123456</code></p>
      </div>
    </div>
  );
}
