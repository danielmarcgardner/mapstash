type User = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

type UserState = {
    currentUser: User | null;
    token: string | null;
    isAuthenticated: boolean;
}
type LoginCredentials = {
    email: string;
    password: string;
}
type SignupCredentials = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
type AuthResponse = {
    user: User;
    token: string;
}
type LoginResponse = AuthResponse;
type SignupResponse = AuthResponse;
type AuthError = {
    errors: string[];
}
type AuthState = {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isError: boolean;
    error: string | null;
    isSuccess: boolean;
    successMessage: string | null;
}
export type {
    User,
    UserState,
    LoginCredentials,
    SignupCredentials,
    AuthResponse,
    LoginResponse,
    SignupResponse,
    AuthError,
    AuthState
};