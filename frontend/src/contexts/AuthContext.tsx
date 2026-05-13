/**
 * @fileoverview Proveedor de contexto de React (Context API) para manejar estados globales (ej. Autenticación).
 * Descripción generada automáticamente para documentar la funcionalidad principal del archivo.
 */
import { createContext, useContext, useState, type ReactNode } from 'react';
import api from '@/lib/api';
import type { AuthUser, LoginCredentials } from '@/types';

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getSavedAuth(): { user: AuthUser | null; token: string | null } {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (savedToken && savedUser) {
        try {
            return { user: JSON.parse(savedUser), token: savedToken };
        } catch {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
    }
    return { user: null, token: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [savedAuth] = useState(getSavedAuth);
    const [user, setUser] = useState<AuthUser | null>(savedAuth.user);
    const [token, setToken] = useState<string | null>(savedAuth.token);
    const [isLoading] = useState(false);

    const login = async (credentials: LoginCredentials) => {
        const response = await api.post('/auth/login', credentials);
        const { token: newToken, user: userData } = response.data;

        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}
