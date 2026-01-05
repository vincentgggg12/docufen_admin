import './App.css'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LoginPage } from './pages/Login/LoginPage'
import TrialExpired from './pages/TrialExpired/TrialExpired'
import DeactivatedAccount from './pages/DeactivatedAccount/DeactivatedAccount'
import MaintenanceWindow from './pages/MaintenanceWindow/MaintenanceWindow'
import { SidebarProvider } from './components/ui/sidebar'
import { useAppStore, useUserStore } from './lib/stateManagement'
import { useShallow } from 'zustand/shallow'
import useAuthorisedUser from './hooks/AuthorisedUser'
import { Toaster } from './components/ui/sonner'
import useAccountData from './hooks/AccountData'
import React, { useEffect } from 'react'
import NotInvitedPage from './pages/Login/NotInvitedPage'
import { useTranslation } from 'react-i18next'
import { DebugToggle } from './components/DebugToggle'
import { ActivityMonitorProvider } from './components/ActivityMonitorProvider'
import InternalAdmin from './pages/InternalAdmin/InternalAdmin'
import { AnalyticsProvider } from './contexts/AnalyticsContext'

interface AuthAppProps {
  autoLogin?: boolean
  children: React.ReactNode
}

// Helper component to maintain debug mode on navigation
const DebugModeHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we need to maintain lng=sw parameter on route changes
  useEffect(() => {
    if (localStorage.getItem('i18nextDebugMode') === 'true' && (!location.search.includes('lng=sw'))) {
      // Add lng=sw parameter without triggering a new navigation
      const newSearch = location.search ? `${location.search}&lng=sw` : '?lng=sw';
      navigate(`${location.pathname}${newSearch}${location.hash}`, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

const RequireAuth: React.FC<AuthAppProps> = (props) => {
  const { t } = useTranslation();
  const { children } = props;
  const autoLogin = props.autoLogin ? props.autoLogin : true;
  const { user, loading } = useAuthorisedUser(autoLogin);
  const { maintenanceMode } = useUserStore(useShallow((state) => ({
    maintenanceMode: state.maintenanceMode,
  })));
  const location = useLocation();

  if (loading) {
    return (
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", width: "100vw"}}>
        <div>{t('loadingRefreshYourBrowserIfTheScreenDoesNotLoadAutomatically')}</div>
    </div>
    )
  }

  // Check for maintenance mode (unless bypass is active)
  const hasBypass = sessionStorage.getItem('maintenanceBypass') === 'true';
  if (maintenanceMode && !hasBypass && location.pathname !== '/maintenance') {
    return <Navigate to="/maintenance" replace />;
  }

  if (user == null) {
    const currentPath = location.pathname;
    if (currentPath !== '/login') {
      sessionStorage.setItem('currentPath', currentPath);
      return <Navigate to="/login" replace />;
    } else {
      return children
    }
  }

  return children;
}

function App() {
  const { t } = useTranslation();
  const { sidebarOpen, setSidebarOpen } = useAppStore(useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })))
  useAccountData()

  return (
    <ActivityMonitorProvider>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        defaultOpen={true}
      >
        <BrowserRouter>
          <AnalyticsProvider>
            <DebugModeHandler />
            <Routes>
            {/* Root redirects to admin */}
            <Route
              path="/"
              element={<Navigate to="/admin" />}
            />

            {/* Login page */}
            <Route
              path="/login"
              element={<LoginPage />}
            />

            {/* Main admin dashboard */}
            <Route
              path="/admin"
              element={
                <RequireAuth><InternalAdmin /></RequireAuth>
              }
            />

            {/* Error/Status pages */}
            <Route
              path="/notinvited"
              element={<NotInvitedPage />}
            />
            <Route
              path="/trial-expired"
              element={<TrialExpired />}
            />
            <Route
              path="/account-deactivated"
              element={<DeactivatedAccount />}
            />
            <Route
              path="/maintenance"
              element={<MaintenanceWindow />}
            />

            {/* Redirect any unknown routes to admin */}
            <Route path="*" element={<Navigate to="/admin" />} />
          </Routes>
          </AnalyticsProvider>
        </BrowserRouter>
        <Toaster />
        <DebugToggle />
      </SidebarProvider>
    </ActivityMonitorProvider>
  )
}

export default App
