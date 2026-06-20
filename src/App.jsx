import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { SongSettingsProvider } from './context/SongSettingsContext';
import { SongIntelligenceProvider } from './context/SongIntelligenceContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { WorshipPlannerProvider } from './context/WorshipPlannerContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
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

// ── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <WorkflowProvider>
              <SongSettingsProvider>
                <SongIntelligenceProvider>
                  <WorshipPlannerProvider>
                    <AppShell />
                  </WorshipPlannerProvider>
                </SongIntelligenceProvider>
              </SongSettingsProvider>
            </WorkflowProvider>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
