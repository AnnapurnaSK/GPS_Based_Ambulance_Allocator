import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // For this task, we call the admin login endpoint
      const response = await fetch("http://127.0.0.1:5000/admin/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem("adminToken", data.token);
        navigate("/admin");
      } else {
        setError(data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Server error. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="glass-card login-card">
        <h2 className="admin-title">🔐 Admin Access</h2>
        <p className="admin-subtitle">Secure Login for Ambulance Management</p>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="admin@ambulance.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Verifying..." : "Enter Command Center"}
          </button>
        </form>

        <button 
          className="back-btn" 
          onClick={() => navigate("/")}
        >
          ← Back to Patient Portal
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
