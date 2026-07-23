import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './core/routes/ProtectedRoute';
import { Login } from './features/auth/Login';
import POSDashboard from './features/pos/POSDashboard';
import { InventoryDashboard } from './features/inventory/InventoryDashboard';
import { ManagerDashboard } from './features/manager/ManagerDashboard';
import { useAuthStore } from './core/store/authStore';
import SuppliersDashboard from './features/suppliers/SuppliersDashboard';

import { ManagerLayout } from './components/layout/ManagerLayout';
import { OrderHistory } from './features/manager/OrderHistory/OrderHistory';
import { ManagerSuppliersDashboard } from './features/manager/ManagerSuppliersDashboard';
import { StaffManagement } from './features/manager/StaffManagement';
import { MenuEngineering } from './features/manager/MenuEngineering';
import { MenuManagement } from './features/manager/MenuManagement';

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
          <Route path="/suppliers" element={<SuppliersDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="suppliers" element={<ManagerSuppliersDashboard />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="orders" element={<OrderHistory />} />
            <Route path="menu-engineering" element={<MenuEngineering />} />
            <Route path="menu" element={<MenuManagement />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
