import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { SongSettingsProvider } from './context/SongSettingsContext';
import { SongIntelligenceProvider } from './context/SongIntelligenceContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { WorshipPlannerProvider } from './context/WorshipPlannerContext';
import { FileDBProvider, useFileDB } from './context/FileDBContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import FileSetupScreen from './components/FileSetupScreen/FileSetupScreen';
import MainLayout from './layouts/MainLayout/MainLayout';
import AuthLayout from './layouts/AuthLayout/AuthLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Songs from './pages/Songs/Songs';
import Events from './pages/Events/Events';
import Directors from './pages/Directors/Directors';
import Requests from './pages/Requests/Requests';
import History from './pages/History/History';
import Settings from './pages/Settings/Settings';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import { ROUTES } from './utils/constants';

const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Planner   = lazy(() => import('./pages/Planner/Planner'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)',
    }}>
      Cargando...
    </div>
  );
}

// ── AppShell: shown only when FileDB status === 'ready' ────────────────────
function AppShell() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
      </Route>

      <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={
            <ProtectedRoute routeKey="dashboard">
              <ErrorBoundary><Dashboard /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.SONGS} element={
            <ProtectedRoute routeKey="songs">
              <ErrorBoundary><Songs /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.EVENTS} element={
            <ProtectedRoute routeKey="events">
              <ErrorBoundary><Events /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.DIRECTORS} element={
            <ProtectedRoute routeKey="directors">
              <ErrorBoundary><Directors /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.REQUESTS} element={
            <ProtectedRoute routeKey="requests">
              <ErrorBoundary><Requests /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.HISTORY} element={
            <ProtectedRoute routeKey="history">
              <ErrorBoundary><History /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.SETTINGS} element={
            <ProtectedRoute routeKey="settings">
              <ErrorBoundary><Settings /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ANALYTICS} element={
            <ProtectedRoute routeKey="analytics">
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Analytics />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.PLANNER} element={
            <ProtectedRoute routeKey="planner">
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Planner />
                </Suspense>
              </ErrorBoundary>
            </ProtectedRoute>
          } />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}

// ── FileDB bridge: inside AppProvider so it can access refreshAll ──────────
function FileDBBridge({ children }) {
  const { refreshAll } = useApp();
  return (
    <FileDBProvider onReady={refreshAll}>
      <FileGate>
        {children}
      </FileGate>
    </FileDBProvider>
  );
}

// ── FileGate: blocks app until FileDB is ready ────────────────────────────
function FileGate({ children }) {
  const { status } = useFileDB();

  // Show setup screen for any non-ready state that requires user interaction
  if (status === 'needs-setup' || status === 'reconnect') {
    return <FileSetupScreen />;
  }

  // Booting or loading: show a minimal spinner (no setup needed, just waiting)
  if (status === 'booting' || status === 'loading') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-primary)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, zIndex: 99999,
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(255,255,255,.1)',
          borderTopColor: '#FF9500',
          borderRadius: '50%',
          animation: 'none',
        }}
          className="app-boot-spinner"
        />
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
          Cargando datos...
        </p>
        <style>{`
          .app-boot-spinner { animation: appBootSpin .8s linear infinite !important; }
          @keyframes appBootSpin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // 'ready' or 'error' (error still renders app, services fall back to localStorage)
  return children;
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <FileDBBridge>
              <WorkflowProvider>
                <SongSettingsProvider>
                  <SongIntelligenceProvider>
                    <WorshipPlannerProvider>
                      <AppShell />
                    </WorshipPlannerProvider>
                  </SongIntelligenceProvider>
                </SongSettingsProvider>
              </WorkflowProvider>
            </FileDBBridge>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
