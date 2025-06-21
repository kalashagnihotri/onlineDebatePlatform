import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/token/', { username, password });
  return response.data;
};

export const register = async (username: string, email: string, password: string, role: string) => {
  const response = await api.post('/users/register/', { username, email, password, role });
  return response.data;
};

// Keep the old function names for backward compatibility
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return login(credentials.username, credentials.password);
};

export const registerUser = async (userData: RegisterData) => {
  return register(userData.username, userData.email, userData.password, userData.role);
}; 