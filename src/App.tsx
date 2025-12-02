import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/authContext';
import { Toaster } from './components/ui/sonner';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Profile } from './pages/Profile';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Suppliers } from './pages/Suppliers';
import { MarketingContracts } from './pages/MarketingContracts';
import { AccountTypes } from './pages/AccountTypes';
import { Bills } from './pages/Bills';
import { OverviewCustomer } from './pages/OverviewCustomer';
import { OverviewSupplier } from './pages/OverviewSupplier';
import { Accounts } from './pages/Accounts';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Nếu user chưa load xong, return null hoặc loading spinner
  if (user === null) return null;

  // Nếu user = null và đã load xong, redirect
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Suppliers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contracts"
        element={
          <ProtectedRoute>
            <MarketingContracts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account-types"
        element={
          <ProtectedRoute>
            <AccountTypes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bills"
        element={
          <ProtectedRoute>
            <Bills />
          </ProtectedRoute>
        }
      />
      <Route
        path="/overview-customer"
        element={
          <ProtectedRoute>
            <OverviewCustomer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/overview-supplier"
        element={
          <ProtectedRoute>
            <OverviewSupplier />
          </ProtectedRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <Accounts />
          </ProtectedRoute>
        }
      />
      {/* Catch-all route for unmatched paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}