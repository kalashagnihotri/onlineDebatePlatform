import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8001/api/v1/', // Your Django backend URL
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 