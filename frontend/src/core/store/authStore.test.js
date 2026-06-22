import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('authStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    useAuthStore.setState({ token: null, user: null });
  });

  it('initializes with null state when localStorage is empty', () => {
    const { token, user } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  it('logs in user and updates state and localStorage', () => {
    const token = 'fake-token';
    const user = { username: 'testuser', role: 'manager' };

    useAuthStore.getState().login(token, user);

    const state = useAuthStore.getState();
    expect(state.token).toBe(token);
    expect(state.user).toEqual(user);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', token);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
  });

  it('logs out user and clears state and localStorage', () => {
    useAuthStore.setState({
      token: 'fake-token',
      user: { username: 'testuser', role: 'manager' }
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });
});
