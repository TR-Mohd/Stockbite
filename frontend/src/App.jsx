import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './core/routes/ProtectedRoute';
import { Login } from './features/auth/Login';

// Import komponen POSDashboard 
import POSDashboard from './features/pos/POSDashboard';

// Dummy components for other features (to be built by other agents)
const InventoryDummy = () => <div style={{ padding: '2rem' }}><h1>Inventory Module</h1><p>Reserved for Abel</p></div>;
const SuppliersDummy = () => <div style={{ padding: '2rem' }}><h1>Suppliers Module</h1><p>Reserved for Anita</p></div>;
const ManagerDummy = () => <div style={{ padding: '2rem' }}><h1>Manager Dashboard</h1><p>Reserved for Farrell</p></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          
          {/* Rute /pos sekarang mengarah ke antarmuka kasir buatanmu! */}
          <Route path="/pos" element={<POSDashboard />} />
          
          <Route path="/inventory" element={<InventoryDummy />} />
          <Route path="/suppliers" element={<SuppliersDummy />} />
          <Route path="/manager" element={<ManagerDummy />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;