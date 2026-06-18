import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { API_ENDPOINTS } from '../config/api';

// Brain of authentication
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage (no token - it's in httpOnly cookie)
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return (storedUser && storedUser !== 'undefined') ? JSON.parse(storedUser) : null;
    });
    
    const [expiresAt, setExpiresAt] = useState(localStorage.getItem('expiresAt') || null);
    const [editWindowMs, setEditWindowMs] = useState(() => {
        const stored = localStorage.getItem('editWindowMs');
        return stored ? Number(stored) : 0;
    });
    const [loading, setLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    // If we restored a user from localStorage, we must verify the backend session
    // before trusting it. Block protected rendering until that check resolves.
    const [initializing, setInitializing] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return !!(storedUser && storedUser !== 'undefined');
    });

    // Synchronously drop the local session (no loader/delay). Used when a stale or
    // expired session is detected, so protected content never lingers on screen.
    const clearSession = useCallback(() => {
        setUser(null);
        setExpiresAt(null);
        localStorage.removeItem('user');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('expiresAtReadable');
        localStorage.removeItem('editWindowMs');
        localStorage.removeItem('token');
        // Best-effort cookie clear on the backend (don't block on it).
        fetch(API_ENDPOINTS.logout, { method: 'POST', credentials: 'include' }).catch(() => {});
    }, []);

    // Logout function: Clears all memory and calls backend to clear cookie
    const logout = useCallback(async () => {
        console.warn("Session ended. Clearing data and logging out...");
        
        setLogoutLoading(true);
        
        // Call backend to clear cookie
        try {
            await fetch(API_ENDPOINTS.logout, {
                method: 'POST',
                credentials: 'include' // Important: sends cookie
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        // Wait for minimum 2 seconds to show loader
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setUser(null);
        setExpiresAt(null);
        setEditWindowMs(0);
        localStorage.removeItem('user');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('expiresAtReadable');
        localStorage.removeItem('editWindowMs');
        localStorage.removeItem('token'); // Clean up old token if exists
        
        setLogoutLoading(false);
        // Navigation happens automatically via React Router when user becomes null
    }, []);

    // Auto-logout on token expiry on .env defined time
    useEffect(() => {
        if (!expiresAt) return;

        const checkExpiration = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();

            if (now >= expiry) {
                console.warn("Token expired. Clearing session...");
                clearSession();
            }
        };
        checkExpiration();
        const interval = setInterval(checkExpiration, 10000); // Check every 10 sec

        return () => clearInterval(interval);
    }, [expiresAt, clearSession]);

    // Verify the backend session on mount BEFORE trusting the restored user.
    // Protected routes are gated on `initializing`, so nothing renders until this
    // resolves — closing the "stale localStorage renders as logged-in" hole.
    useEffect(() => {
        const verifySession = async () => {
            // Nothing restored from localStorage => nothing to verify.
            if (!user) {
                setInitializing(false);
                return;
            }

            try {
                const response = await fetch(API_ENDPOINTS.verify, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    // Cookie is invalid or missing - drop the stale session.
                    console.warn('Session invalid. Clearing session...');
                    clearSession();
                } else {
                    const data = await response.json();
                    if (data && data.editWindowMs != null) {
                        setEditWindowMs(data.editWindowMs);
                        localStorage.setItem('editWindowMs', String(data.editWindowMs));
                    }
                }
            } catch (error) {
                console.error('Session verification failed:', error);
                clearSession();
            } finally {
                setInitializing(false);
            }
        };

        verifySession();
    }, []); // Only run on mount

    // Login function: Calls backend and saves the dynamic expiry time
    const login = async (employeeId, password) => {
        setLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ employeeId, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const readableExpiry = new Date(data.expiresAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
 
                // Save to State
                setUser(data.user);
                setExpiresAt(data.expiresAt);
                if (data.editWindowMs != null) setEditWindowMs(data.editWindowMs);

                // Save to LocalStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('expiresAt', data.expiresAt);
                localStorage.setItem('expiresAtReadable', readableExpiry);
                if (data.editWindowMs != null) localStorage.setItem('editWindowMs', String(data.editWindowMs));

                setLoading(false);
                return data;
            } else {
                setLoading(false);
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            setLoading(false);
            console.error('Login Error:', error.message);
            throw error;
        }
    };

    const value = {
        user,
        setUser,
        setExpiresAt,
        loading,
        logoutLoading,
        initializing,
        editWindowMs,
        login,
        logout,
        clearSession,
        // Check if user is Admin based on role or department
        isAdmin: user?.role === 'admin' || user?.department === 'Admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy access to Auth
export const useAuth = () => useContext(AuthContext);