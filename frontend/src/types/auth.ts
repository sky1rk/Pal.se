export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface LoginInput {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface SignupInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
}
