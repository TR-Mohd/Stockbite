import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './core/routes/ProtectedRoute';
import { Login } from './features/auth/Login';
import POSDashboard from './features/pos/POSDashboard';
import { InventoryDashboard } from './features/inventory/InventoryDashboard';
import { ManagerDashboard } from './features/manager/ManagerDashboard';
import { useAuthStore } from './core/store/authStore';

// Dummy components for other features (to be built by other agents)
const SuppliersDummy = () => <div style={{ padding: '2rem' }}><h1>Suppliers Module</h1><p>Reserved for Anita</p></div>;

const RoleRedirect = () => {
  const { user } = useAuthStore();
  if (user?.role === 'Cashier') return <Navigate to="/pos" replace />;
  if (user?.role === 'Warehouse') return <Navigate to="/inventory" replace />;
  if (user?.role === 'Manager') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Cashier']} />}>
          <Route path="/pos" element={<POSDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Warehouse']} />}>
          <Route path="/inventory" element={<InventoryDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        </Route>
        
        <Route element={<ProtectedRoute allowedRoles={['Warehouse', 'Manager']} />}>
          <Route path="/suppliers" element={<SuppliersDummy />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
