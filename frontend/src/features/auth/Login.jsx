import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../core/store/authStore';
import api from '../../core/api/axios';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import styles from './Login.module.css';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
      // Or we decode the JWT if user object is not returned.
      // For now, let's mock the user object if backend doesn't provide it alongside token.
      const userObj = response.data.user || { username, role: 'manager' }; // Dummy role fallback

      login(response.data.access_token, userObj);
      navigate('/'); // Redirect to home/pos after login
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
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
