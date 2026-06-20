import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import './Login.css';

export default function Login() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname ?? ROUTES.DASHBOARD;

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

  return (
    <div className="login">
      <div className="login__header">
        <div className="login__logo-wrap">
          <img src="/favicon-192.png" alt="Logo" className="login__logo-img" />
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
    </div>
  );
}
