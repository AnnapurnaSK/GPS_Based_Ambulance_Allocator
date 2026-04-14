import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const AdminDashboard = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState(null);
  
  // Form State
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
        setError("Failed to fetch ambulances.");
      }
    } catch (err) {
      setError("Server connection failed.");
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
        alert("Operation failed. Check if vehicle number is unique.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  const handleDelete = async (vehicleNumber) => {
    if (!window.confirm("Are you sure you want to remove this ambulance?")) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/admin/api/deleteDriver/${vehicleNumber}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAmbulances();
      } else {
        alert("Failed to delete.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav glass-card">
        <h1>🚔 Ambulance Dispatch Command</h1>
        <div className="nav-actions">
          <button className="add-btn" onClick={() => handleOpenModal()}>+ Add New Unit</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {error && <div className="error-banner">{error}</div>}

      <div className="ambulance-grid">
        {loading ? (
          <div className="loading-state">Scanning Fleet...</div>
        ) : ambulances.length === 0 ? (
          <div className="empty-state">No ambulances registered in the system.</div>
        ) : (
          ambulances.map((amb) => (
            <div key={amb.vehicleNumber} className="glass-card ambulance-card">
              <div className={`status-badge ${amb.status}`}>{amb.status}</div>
              <h3>{amb.vehicleNumber}</h3>
              <p><strong>Driver:</strong> {amb.name}</p>
              <p><strong>Contact:</strong> {amb.contact}</p>
              <p><strong>Email:</strong> {amb.email}</p>
              <div className="card-actions">
                <button className="edit-icon-btn" onClick={() => handleOpenModal(amb)}>✏️ Edit</button>
                <button className="delete-icon-btn" onClick={() => handleDelete(amb.vehicleNumber)}>🗑️ Remove</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <h2>{editingAmbulance ? "Edit Ambulance" : "Add New Ambulance"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <label>Vehicle Number</label>
                  <input 
                    type="text" 
                    value={formData.vehicleNumber} 
                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} 
                    disabled={!!editingAmbulance}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Driver Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Contact Number</label>
                  <input 
                    type="text" 
                    value={formData.contact} 
                    onChange={(e) => setFormData({...formData, contact: e.target.value})} 
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Driver Email</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Address / Base Station</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  required 
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  {editingAmbulance ? "Save Changes" : "Register Ambulance"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
