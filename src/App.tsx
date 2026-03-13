import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Vehicles } from './pages/Vehicles';
import { Catalog } from './pages/Catalog';
import { Quotes } from './pages/Quotes';
import { WorkOrders } from './pages/WorkOrders';
import { Leads } from './pages/Leads';
import { Settings } from './pages/Settings';
import Financial from './pages/Financial';
import { WhatsApp } from './pages/WhatsApp';
import { LandingPage } from './pages/LandingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppRoutes() {
  const { currentUser, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={currentUser ? <Navigate to="/home" /> : <LandingPage />} />
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/home" />} />
      
      {currentUser ? (
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
