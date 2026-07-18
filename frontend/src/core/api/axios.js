import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Skip if it's already a refresh request or login
    if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/token') {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await api.post('/auth/refresh', {
          refresh_token: refreshToken
        });
        
        const newAccessToken = data.access_token;
        const user = useAuthStore.getState().user;
        useAuthStore.getState().login(newAccessToken, refreshToken, user);
        
        processQueue(null, newAccessToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
