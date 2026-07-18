import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/store/authStore';
import api from '../../core/api/axios';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import styles from './Login.module.css';

// Add Eye Icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Mocking the FastAPI OAuth2PasswordRequestForm structure
      // Usually requires URL encoded form data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Assuming backend returns { access_token: "...", token_type: "bearer", user: {...} }
      // Decode the JWT if user object is not returned.
      let userObj = response.data.user;
      if (!userObj && response.data.access_token) {
        try {
          const payload = JSON.parse(atob(response.data.access_token.split('.')[1]));
          userObj = { username: payload.sub || username, role: payload.role || 'Cashier' };
        } catch (e) {
          userObj = { username, role: 'Cashier' };
        }
      } else if (!userObj) {
        userObj = { username, role: 'Cashier' };
      }

      login(response.data.access_token, response.data.refresh_token, userObj);
      
      const role = userObj.role || 'Cashier';
      if (role === 'Cashier') {
        navigate('/pos');
      } else if (role === 'Warehouse') {
        navigate('/inventory');
      } else if (role === 'Manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        <CardHeader>
          <h1 className={styles.title}>Stockbite</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form className={styles.form} onSubmit={handleLogin}>
            <Input
              label="Username"
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '28px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
