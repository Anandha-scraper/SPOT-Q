import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';

// Brain of authentication
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage (no token - it's in httpOnly cookie)
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return (storedUser && storedUser !== 'undefined') ? JSON.parse(storedUser) : null;
    });
    
    const [expiresAt, setExpiresAt] = useState(localStorage.getItem('expiresAt') || null);
    const [loading, setLoading] = useState(false);

    // Logout function: Clears all memory and calls backend to clear cookie
    const logout = useCallback(async () => {
        console.warn("Session ended. Clearing data and logging out...");
        
        // Call backend to clear cookie
        try {
            await fetch('http://localhost:5000/api/v1/auth/logout', {
                method: 'POST',
                credentials: 'include' // Important: sends cookie
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        setUser(null);
        setExpiresAt(null);
        localStorage.removeItem('user');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('expiresAtReadable');
        localStorage.removeItem('token'); // Clean up old token if exists
        // Optional: Redirect to login page
        window.location.href = '/login';
    }, []);

    // Auto-logout on token expiry on .env defined time
    useEffect(() => {
        if (!expiresAt) return;

        const checkExpiration = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            
            if (now >= expiry) {
                console.warn("Token expired. Logging out...");
                logout();
            }
        };
        checkExpiration();
        const interval = setInterval(checkExpiration, 10000); // Check every 10 sec
        
        return () => clearInterval(interval);
    }, [expiresAt, logout]);

    // Verify token on mount - check if cookie still exists
    useEffect(() => {
        const verifySession = async () => {
            // Only verify if we have user data in localStorage
            if (!user) return;

            try {
                const response = await fetch('http://localhost:5000/api/v1/auth/verify', {
                    credentials: 'include'
                });

                if (!response.ok) {
                    // Cookie is invalid or missing - logout
                    console.warn('Session invalid. Logging out...');
                    logout();
                }
            } catch (error) {
                console.error('Session verification failed:', error);
                logout();
            }
        };

        verifySession();
    }, []); // Only run on mount

    // Login function: Calls backend and saves the dynamic expiry time
    const login = async (employeeId, password) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Important: allows cookies to be set
                body: JSON.stringify({ employeeId, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Create readable expiry format for human reference
                const readableExpiry = new Date(data.expiresAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
 
                // Save to State (no token - it's in httpOnly cookie)
                setUser(data.user);
                setExpiresAt(data.expiresAt);
                
                // Save to LocalStorage for persistence (no token stored)
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('expiresAt', data.expiresAt); // ISO format for calculations
                localStorage.setItem('expiresAtReadable', readableExpiry); // Human-readable format
                
                return data;
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login Error:', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
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