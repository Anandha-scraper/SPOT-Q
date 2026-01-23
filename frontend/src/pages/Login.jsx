import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { EyeButton } from "../Components/Buttons";
import "../styles/PageStyles/Login.css";

const Login = () => {
  const { login } = useContext(AuthContext);

  // Login state
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
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

    try {
      await login(employeeId, password);
      // Navigation happens automatically via AuthContext setting user
    } catch (err) {
      setError(err?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="login-container">
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
  );
};

export default Login;