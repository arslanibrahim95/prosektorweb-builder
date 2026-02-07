'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    collection: 'users' | 'customers';
    companyName?: string; // For customers
    firstName?: string; // For users
    lastName?: string; // For users
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check for token in cookies or local storage (Payload usually sets httpOnly cookie, 
            // but for client-side access we might need to rely on /api/users/me endpoint)

            // Since Payload Auth uses cookies by default for the API, we can just call /api/customers/me
            // However, we need to know WHICH collection to check. For this project, we primarily care about 'customers' for the frontend portal.
            // Admin users use the /admin panel which has its own context. This context is for the SITE FRONTEND.

            const res = await fetch('/api/customers/me');

            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setUser({
                        id: data.user.id,
                        email: data.user.email,
                        collection: 'customers',
                        companyName: data.user.companyName,
                    });
                    // We don't have the raw token here if it's httpOnly cookie, but that's fine for session
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = (newToken: string, newUser: User) => {
        // In a cookie-based flow, the login API sets the cookie.
        // We just update the state here to reflect the change immediately.
        setToken(newToken);
        setUser(newUser);
    };

    const logout = async () => {
        try {
            await fetch('/api/customers/logout', { method: 'POST' });
            setUser(null);
            setToken(null);
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
