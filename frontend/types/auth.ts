export type UserRole = "STUDENT" | "STAFF" | "MANAGER";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string | null;
  phone?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  studentId: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: User;
  };
}