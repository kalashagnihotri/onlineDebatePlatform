import axios from 'axios';

// Function to get the appropriate API base URL
const getApiBaseUrl = (): string => {
  // Check if we're in network mode
  const isNetworkMode = process.env.REACT_APP_NETWORK_MODE === 'true';
  
  if (isNetworkMode || !process.env.REACT_APP_API_BASE_URL) {
    // Use current host with the Django port
    const port = process.env.REACT_APP_DJANGO_PORT || '8000';
    return `http://${window.location.hostname}:${port}`;
  }
  
  // Use the configured base URL for localhost development
  return process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
};

const api = axios.create({
  baseURL: `${getApiBaseUrl()}/api/v1/`,
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