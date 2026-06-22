# Core Infrastructure Developer Guide

Welcome to the Core Infrastructure documentation! This guide explains how to interact with the authentication, routing, and API infrastructure that has been set up for the Stockbite frontend. 

Please read this carefully before building your individual modules (POS, Inventory, Suppliers, Manager).

## 1. API Calls (CRITICAL)

**DO NOT use standard `fetch` or a raw `axios` import to make backend calls.**

An Axios instance has been pre-configured to automatically handle the `Authorization: Bearer <token>` injection for every request. If you use this instance, you do not need to worry about managing tokens manually.

```javascript
// ✅ DO THIS
import api from '../core/api/axios';

const fetchInventory = async () => {
  // The token is automatically attached!
  const response = await api.get('/inventory/items'); 
  return response.data;
};

// ❌ DO NOT DO THIS
import axios from 'axios';
// This request will fail with a 401 Unauthorized because it lacks the token!
const response = await axios.get('http://localhost:8000/inventory/items'); 
```

## 2. Using the Auth Store (Zustand)

Global authentication state (the JWT token and the current User's data) is managed via a Zustand store. You can easily access the current user's role, username, or token from anywhere in your components.

```javascript
import { useAuthStore } from '../core/store/authStore';

const MyComponent = () => {
  // Extract user details directly from the global state
  const { user } = useAuthStore();

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      {user?.role === 'manager' && (
        <button>Manager Only Action</button>
      )}
    </div>
  );
};
```

## 3. Protecting Your Routes

When you build your feature and wire it up in `App.jsx`, you don't need to manually check if a user is logged in. 

Simply wrap your routes inside the `<ProtectedRoute>` component. You can also pass an optional `allowedRoles` array to restrict access to specific RBAC roles (e.g., restricting the Manager Dashboard to only `manager` roles).

```javascript
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './core/routes/ProtectedRoute';

// Example routing in App.jsx
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Any routes inside this wrapper require authentication */}
      <Route element={<ProtectedRoute />}>
        {/* Accessible to anyone logged in */}
        <Route path="/pos" element={<POSModule />} />
        <Route path="/inventory" element={<InventoryModule />} />
        
        {/* Accessible ONLY to managers */}
        <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
          <Route path="/manager" element={<ManagerDashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}
```

If a user is not logged in, `<ProtectedRoute>` will instantly bounce them back to the `/login` screen. If they are logged in but lack the required role, it will redirect them to the home screen.
