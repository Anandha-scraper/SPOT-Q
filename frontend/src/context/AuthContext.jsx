import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';

// Brain of authentication
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return (storedUser && storedUser !== 'undefined') ? JSON.parse(storedUser) : null;
    });
    
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [expiresAt, setExpiresAt] = useState(localStorage.getItem('expiresAt') || null);
    const [loading, setLoading] = useState(false);

    // Logout function: Clears all memory and redirects
    const logout = useCallback(() => {
        console.warn("Session ended. Clearing local storage and logging out...");
        setUser(null);
        setToken(null);
        setExpiresAt(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('expiresAtReadable');
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

    // Login function: Calls backend and saves the dynamic expiry time
    const login = async (employeeId, password) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Create readable expiry format
                const readableExpiry = new Date(data.expiresAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                
                console.log(`Login Session expires at: ${readableExpiry}`);
                
                // Save to State
                setUser(data.user);
                setToken(data.token);
                setExpiresAt(data.expiresAt);
                
                // Save to LocalStorage for persistence
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                localStorage.setItem('expiresAt', data.expiresAt);
                localStorage.setItem('expiresAtReadable', readableExpiry); // Human-readable version
                
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
        token,
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