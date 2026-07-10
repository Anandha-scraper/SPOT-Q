import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { EyeButton } from "../Components/Buttons";
import Loader from "../Components/Loader";
import { API_ENDPOINTS } from "../config/api";
import "../styles/PageStyles/Login.css";

const Login = () => {
  const { setUser, setExpiresAt,setEditWindowMs } = useContext(AuthContext);

  // Login state
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading state for navigation
  const [isLoading, setIsLoading] = useState(false);
  
  // Server connection status
  const [serverStatus, setServerStatus] = useState("connecting");

  // Check server health on component mount - simple polling until connected
  useEffect(() => {
    let isMounted = true;
    let pollInterval;
    
    const checkServerHealth = async () => {
      if (!isMounted) return;
      
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache',
        });
        
        if (response.ok && isMounted) {
          setServerStatus("connected");
          // Clear polling
          if (pollInterval) clearInterval(pollInterval);
          // Hide after 3 seconds
          setTimeout(() => {
            if (isMounted) setServerStatus(null);
          }, 3000);
        }
      } catch (err) {
        // Keep polling - server not ready yet
        console.log('Server still starting...');
      }
    };
    
    // Initial check
    checkServerHealth();
    
    // Poll every 3 seconds until connected
    pollInterval = setInterval(checkServerHealth, 3000);
    
    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!employeeId || !password) {
      setError("Please enter both Employee ID and Password");
      return;
    }

    setIsLoading(true);
    
    try {
      // Call login API
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Wait for minimum 3 seconds while showing loader
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Save data to localStorage
        const readableExpiry = new Date(data.expiresAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('expiresAt', data.expiresAt);
        localStorage.setItem('expiresAtReadable', readableExpiry);
        localStorage.setItem('editWindowMs', String(data.editWindowMs ?? 0));
        
        // Update AuthContext state directly - triggers React Router navigation
        setUser(data.user);
        setExpiresAt(data.expiresAt);
        setEditWindowMs(data.editWindowMs ?? 0);
      } else {
        setIsLoading(false);
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setIsLoading(false);
      setError(err?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="login-loader-overlay">
          <Loader />
        </div>
      ) : null}
      <div className="login-container" style={{ display: isLoading ? 'none' : 'flex' }}>
        {/* Server Connection Status Badge */}
        <div className={`server-status-badge ${serverStatus}`}>
          <div className="server-status-icon">
            {serverStatus === 'connecting' ? (
              <svg className="server-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
              </svg>
            ) : (
              <svg className="server-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="server-status-text">
            <span className="server-status-label">
              {serverStatus === 'connecting' ? 'Sakthi Auto Server is Connecting' : 'Sakthi Auto Server Connected'}
            </span>
            {serverStatus === 'connecting' && (
              <span className="server-status-sub">Please wait — cold start in progress</span>
            )}
          </div>
          <div className={`server-status-dot ${serverStatus}`} />
        </div>

        {/* Left side - Company Logo */}
        <div className="login-left">
        <img
          src="/images/sakthiautologo.png"
          alt="Sakthi Auto Logo"
          className="company-logo"
        />
      </div>

      {/* Right side - Login */}
      <div className="login-right">
        <div className="login-box">
          <h2>Welcome Back</h2>
          <p className="login-subtext">Please login with your Employee ID</p>

          <form onSubmit={handleSubmit}>
            
            {/* Employee ID Field */}
            <div className="form-row">
              <label className="form-label">Employee ID:</label>
              
              <input
                type="text"
                placeholder="Enter Employee ID" 
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                autoComplete="username"
                autoFocus
                className="form-input"
              />
            </div>

            {/* Password Field */}
            <div className="form-row">
              <label className="form-label">Password:</label>
              <div className="password-wrapper">
                
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="form-input"
                />
                <div className="password-toggle">
                  <EyeButton
                    isVisible={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="login-btn">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;