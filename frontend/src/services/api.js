import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dockmaster_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error;

    if (status === 401) {
      localStorage.removeItem('dockmaster_token');
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error("You don't have permission to do that");
    } else if (status === 409) {
      toast.error(message || 'Conflict — resource is in use');
    } else if (status === 500) {
      toast.error('Something went wrong, please try again');
    }
    // 422 and 404 are handled inline by individual components
    return Promise.reject(error);
  }
);

export default api;
