import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dockmaster_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('dockmaster_token');
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error("You don't have permission to perform this action");
    } else if (status === 500) {
      toast.error('Something went wrong, please try again');
    }
    return Promise.reject(error);
  }
);

export default api;
