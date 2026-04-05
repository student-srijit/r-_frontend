import { apiClient } from './api';

export interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  token: string;
}

export async function register(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  const response = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
    firstName,
    lastName,
  });

  if (!response.success) {
    return { success: false, error: response.message };
  }

  const user: User = {
    userId: response.data!.userId,
    email: response.data!.email,
    firstName: response.data!.firstName,
    lastName: response.data!.lastName,
  };

  return {
    success: true,
    user,
    token: response.data!.token,
  };
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  const response = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });

  if (!response.success) {
    return { success: false, error: response.message };
  }

  const user: User = {
    userId: response.data!.userId,
    email: response.data!.email,
    firstName: response.data!.firstName,
    lastName: response.data!.lastName,
  };

  return {
    success: true,
    user,
    token: response.data!.token,
  };
}

export function logout() {
  apiClient.clearToken();
}
