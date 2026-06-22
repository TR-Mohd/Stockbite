import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Login } from './Login';
import api from '../../core/api/axios';
import { useAuthStore } from '../../core/store/authStore';

// Mock axios
vi.mock('../../core/api/axios');

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ token: null, user: null });
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('renders login form correctly', () => {
    renderLogin();
    
    expect(screen.getByText('Stockbite')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    // Mock API success response
    api.post.mockResolvedValueOnce({
      data: {
        access_token: 'fake-token-123',
        user: { username: 'Mohammed', role: 'manager' }
      }
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'Mohammed' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    // Verify loading state
    expect(screen.getByRole('button', { name: /signing in\.\.\./i })).toBeInTheDocument();

    await waitFor(() => {
      // Verify API call
      expect(api.post).toHaveBeenCalledWith('/auth/token', expect.any(URLSearchParams), expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }));
      
      // Verify store was updated
      const { token, user } = useAuthStore.getState();
      expect(token).toBe('fake-token-123');
      expect(user).toEqual({ username: 'Mohammed', role: 'manager' });
      
      // Verify navigation to home
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles login failure', async () => {
    // Mock API failure
    api.post.mockRejectedValueOnce(new Error('Unauthorized'));

    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
    });

    // Ensure store is still empty and no navigation happened
    const { token } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
