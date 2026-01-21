import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { EyeButton } from "../Components/Buttons";
import Button from '../Components/Buttons';
import Loader from '../Components/Loader';
import "../styles/PageStyles/Login.css";

const Login = () => {
  const { login } = useContext(AuthContext);

  // Login state
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!employeeId || !password) {
      setError("Please enter both Employee ID and Password");
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      await login(employeeId, password);
      // AuthContext will set user/token; router in app.jsx will redirect
      
      // Ensure loader shows for at least 5 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 5000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    } catch (err) {
      setError(err?.message || "Login failed. Please check your credentials.");
      
      // Still wait 5 seconds even on error
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 5000 - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  return (
    <div className="login-container">
      {loading && (
        <div className="login-loader-overlay">
          <Loader />
        </div>
      )}
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
                disabled={loading}
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
                  disabled={loading}
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

            <Button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;