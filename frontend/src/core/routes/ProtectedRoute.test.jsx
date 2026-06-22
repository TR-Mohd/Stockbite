import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../store/authStore';

const DummyChild = () => <div>Protected Content</div>;
const LoginDummy = () => <div>Login Page</div>;
const HomeDummy = () => <div>Home Page</div>;

const renderRoute = (allowedRoles = []) => {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<LoginDummy />} />
        <Route path="/" element={<HomeDummy />} />
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/protected" element={<DummyChild />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
  });

  it('redirects to /login if user is not authenticated', () => {
    renderRoute();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders child component if user is authenticated and no specific roles are required', () => {
    useAuthStore.setState({ 
      token: 'valid-token', 
      user: { username: 'user1', role: 'cashier' } 
    });
    
    renderRoute();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders child component if user role matches allowed roles', () => {
    useAuthStore.setState({ 
      token: 'valid-token', 
      user: { username: 'manager1', role: 'manager' } 
    });
    
    renderRoute(['manager', 'admin']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to / if user is authenticated but role does not match', () => {
    useAuthStore.setState({ 
      token: 'valid-token', 
      user: { username: 'user1', role: 'cashier' } 
    });
    
    renderRoute(['manager', 'admin']);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
