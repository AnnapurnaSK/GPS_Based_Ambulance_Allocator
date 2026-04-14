import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatsCard from "./components/StatsCard";
import "./App.css";

const AdminDashboard = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState(null);
  
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    name: "",
    contact: "",
    email: "",
    address: "",
    status: "available"
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchAmbulances();
  }, [token, navigate]);

  const fetchAmbulances = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/admin/api/getAllDrivers", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAmbulances(data);
      } else {
        setError("Failed to access secure fleet data.");
      }
    } catch (err) {
      setError("Secure link to Command Center lost.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ambulance = null) => {
    if (ambulance) {
      setEditingAmbulance(ambulance);
      setFormData(ambulance);
    } else {
      setEditingAmbulance(null);
      setFormData({
        vehicleNumber: "",
        name: "",
        contact: "",
        email: "",
        address: "",
        status: "available"
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingAmbulance 
      ? `http://127.0.0.1:5000/admin/api/updateDriver/${formData.vehicleNumber}`
      : `http://127.0.0.1:5000/admin/api/insertDriver`;
    
    const method = editingAmbulance ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchAmbulances();
        setShowModal(false);
      } else {
        alert("Operation failed. Resource conflict detected.");
      }
    } catch (err) {
      alert("Error transmitting data to satellite.");
    }
  };

  const handleDelete = async (vehicleNumber) => {
    if (!window.confirm("CONFIRM: Permanently decommission this unit?")) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/admin/api/deleteDriver/${vehicleNumber}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAmbulances();
      } else {
        alert("Authorization required for deletion.");
      }
    } catch (err) {
      alert("Relay error during decommission.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const stats = {
    total: ambulances.length,
    active: ambulances.filter(a => a.status === "busy").length,
    available: ambulances.filter(a => a.status === "available").length,
  };

  return (
    <div className="dashboard-container">
      {/* Premium Navbar */}
      <nav className="dashboard-nav glass-effect">
        <div className="nav-brand">
          <span className="brand-icon">⚡</span>
          <div className="brand-text">
            <h1>Command Center</h1>
            <span className="brand-status">Fleet Online // Secure Channel</span>
          </div>
        </div>
        <div className="nav-actions">
          <button className="add-btn neon-btn" onClick={() => handleOpenModal()}>
            + Deploy New Unit
          </button>
          <button className="logout-btn transparent-btn" onClick={handleLogout}>
            Logout Session
          </button>
        </div>
      </nav>

      {/* Stats Header */}
      <div className="stats-container">
        <StatsCard 
          title="Total Fleet" 
          value={stats.total} 
          icon="🚔" 
          trend="+2" 
          color="#00d2ff" 
        />
        <StatsCard 
          title="Active Missions" 
          value={stats.active} 
          icon="🚨" 
          trend={stats.active > 0 ? "+1" : "0"} 
          color="#ff416c" 
        />
        <StatsCard 
          title="Available Units" 
          value={stats.available} 
          icon="✅" 
          trend="-1" 
          color="#27ae60" 
        />
      </div>

      {error && <div className="error-banner glass-effect">{error}</div>}

      {/* Fleet Grid */}
      <div className="ambulance-grid">
        {loading ? (
          <div className="loading-state">
            <div className="scanner-line"></div>
            <span>Syncing with Global Relay...</span>
          </div>
        ) : ambulances.length === 0 ? (
          <div className="empty-state glass-effect">
            <p>No active units detected on current sector.</p>
            <button className="add-btn" onClick={() => handleOpenModal()}>Initialize First Unit</button>
          </div>
        ) : (
          ambulances.map((amb) => (
            <div key={amb.vehicleNumber} className="glass-card ambulance-card interactive-card">
              <div className={`status-pill ${amb.status}`}>
                <span className="status-dot"></span>
                {amb.status.toUpperCase()}
              </div>
              
              <div className="card-header">
                <div className="vehicle-id">
                  <span className="label">UNIT ID</span>
                  <h3>{amb.vehicleNumber}</h3>
                </div>
                <div className="driver-avatar">
                   {amb.name.charAt(0)}
                </div>
              </div>

              <div className="info-block">
                <div className="info-item">
                  <span className="label">OPERATOR</span>
                  <span className="value">{amb.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">CONTACT</span>
                  <span className="value">{amb.contact}</span>
                </div>
                <div className="info-item">
                  <span className="label">COMMS</span>
                  <span className="value muted">{amb.email}</span>
                </div>
              </div>

              <div className="card-footer-actions">
                <button className="btn-icon edit" onClick={() => handleOpenModal(amb)}>
                  <span>✏️</span> Reconfigure
                </button>
                <button className="btn-icon delete" onClick={() => handleDelete(amb.vehicleNumber)}>
                  <span>🗑️</span> Purge
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Premium Modal */}
      {showModal && (
        <div className="modal-overlay blur-bg">
          <div className="glass-card modal-content slide-up">
            <div className="modal-header">
              <h2>{editingAmbulance ? "Unit Reconfiguration" : "New Unit Deployment"}</h2>
              <p>Enter data for encrypted sector database.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="premium-form">
              <div className="form-grid">
                <div className="input-group">
                  <label>Vehicle ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. KA-01-AB-1234"
                    value={formData.vehicleNumber} 
                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} 
                    disabled={!!editingAmbulance}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Operator Name</label>
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Comms Frequency (Contact)</label>
                  <input 
                    type="text" 
                    placeholder="10-digit primary"
                    value={formData.contact} 
                    onChange={(e) => setFormData({...formData, contact: e.target.value})} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Secure Email</label>
                  <input 
                    type="email" 
                    placeholder="driver@emergency.com"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Base Station Sector</label>
                <input 
                  type="text" 
                  placeholder="Street, City, Sector"
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  required 
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn neon-fill">
                  {editingAmbulance ? "Proceed with Sync" : "Deploy Logic"}
                </button>
                <button type="button" className="cancel-btn transparent-btn" onClick={() => setShowModal(false)}>
                  Abort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
