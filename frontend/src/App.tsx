import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { KillSwitchProvider } from './context/KillSwitchContext';

import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { WalletManagement } from './pages/WalletManagement';
import { AgentManagement } from './pages/AgentManagement';
import { TransactionMonitor } from './pages/TransactionMonitor';
import { PolicyStudio } from './pages/PolicyStudio';
import { ApprovalCenter } from './pages/ApprovalCenter';
import { SecurityLab } from './pages/SecurityLab';
import { AuditLedger } from './pages/AuditLedger';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center text-white text-sm">
        Loading AgentVault Governance Engine...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <KillSwitchProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
            <Route path="/wallets" element={<ProtectedRoute><WalletManagement /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><AgentManagement /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><TransactionMonitor /></ProtectedRoute>} />
            <Route path="/policy" element={<ProtectedRoute><PolicyStudio /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute><ApprovalCenter /></ProtectedRoute>} />
            <Route path="/security-lab" element={<ProtectedRoute><SecurityLab /></ProtectedRoute>} />
            <Route path="/ledger" element={<ProtectedRoute><AuditLedger /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </KillSwitchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
