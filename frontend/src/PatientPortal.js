import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "./App.css";

// Fix for default marker icon issues in React-Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Ambulance Icon
const ambulanceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1032/1032989.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

function PatientPortal() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemo = () => {
    setName("Maanvi Sharma");
    setPhone("9876543210");
    setLocation({ lat: 12.9305, lng: 77.6054 }); // Koramangala, Bengaluru
    setStatus("✅ Demo data loaded! Localized to Bengaluru 🇮🇳");
  };

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[6-9]\d{9}$/;

    if (name.trim().length < 3) newErrors.name = "Name must be at least 3 characters.";
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) newErrors.phone = "Enter a valid 10-digit Indian number.";
    if (!location) newErrors.location = "Please capture your location first.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getLocation = () => {
    setStatus("📍 Detecting your coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(coords);
        setErrors(prev => ({ ...prev, location: null }));
        setStatus("✅ Location captured.");
      },
      (err) => {
        console.error(err);
        setStatus("❌ Location permission denied. Using fallback (Bengaluru).");
        setLocation({ lat: 12.9716, lng: 77.5946 });
      }
    );
  };

  const requestAmbulance = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setStatus("🚑 Searching for the nearest ambulance...");
    
    try {
      const response = await fetch("http://localhost:5000/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, location }),
      });

      const data = await response.json();

      if (response.ok) {
        setAmbulance(data.ambulance);
        setStatus(`✅ ${data.message}`);
      } else {
        setStatus(`❌ ${data.error || data.message || "Allocation failed."}`);
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Server error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = location ? [location.lat, location.lng] : [20, 77]; // Centered on India
  const zoom = location ? 14 : 5;

  return (
    <div className="app-wrapper">
      <div className="sidebar">
        <div className="card">
          <div className="branding">
            <h1>🚑 Emergency</h1>
            <p className="subtitle">Global Ambulance Allocator</p>
          </div>

          <div className="mode-section demo-section">
            <span className="section-label">Simulation / Testing</span>
            <button className="demo-btn" onClick={handleDemo}>
              🧪 Test with Demo Data
            </button>
          </div>

          <hr className="divider" />

          <div className="mode-section real-time-section">
            <span className="section-label">Real-time Emergency Request</span>
            
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Maanvi Sharma"
                className={errors.name ? 'error' : ''}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                }}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="input-group">
              <label>Phone Number (India)</label>
              <input
                type="text"
                placeholder="+91 9876543210"
                className={errors.phone ? 'error' : ''}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                }}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            <button className={`location-btn ${location ? 'captured' : ''} ${errors.location ? 'error' : ''}`} onClick={getLocation} disabled={loading}>
              {location ? "📍 Current Location Captured" : "📍 Detect My Current Location"}
            </button>
            {errors.location && <span className="error-text centered">{errors.location}</span>}

            <button 
              className={`main-btn ${loading ? 'loading' : ''}`} 
              onClick={requestAmbulance} 
              disabled={loading}
            >
              {loading ? "📡 Scanning for Unit..." : "🚑 Request Nearest Ambulance"}
            </button>
          </div>

          {status && (
            <div className={`status-box ${status.includes('⏳') || status.includes('📡') ? 'scanning' : ''} ${status.startsWith('❌') ? 'error' : 'success'}`}>
              {status.includes('Searching') && <div className="radar-ping"></div>}
              <p>{status}</p>
            </div>
          )}

          {ambulance && (
            <div className="ambulance-result-card">
              <div className="result-header">
                <h3>🚑 Nearest Ambulance Found</h3>
                <span className="badge">Active Unit</span>
              </div>
              
              <div className="result-grid">
                <div className="result-item">
                  <span className="label">🏥 Hospital</span>
                  <span className="value">{ambulance.hospital}</span>
                </div>
                {ambulance.driver && (
                  <>
                    <div className="result-item">
                      <span className="label">👤 Driver</span>
                      <span className="value">{ambulance.driver.name}</span>
                    </div>
                    <div className="result-item">
                      <span className="label">📞 Contact</span>
                      <span className="value">{ambulance.driver.contact}</span>
                    </div>
                  </>
                )}
                <div className="result-item">
                  <span className="label">📏 Distance</span>
                  <span className="value">{ambulance.distance} km</span>
                </div>
                <div className="result-item">
                  <span className="label">⏱️ ETA</span>
                  <span className="value">{ambulance.duration} mins</span>
                </div>
              </div>

              <button className="reset-btn" onClick={() => setAmbulance(null)}>
                Clear Result
              </button>
            </div>
          )}
          
          <button className="admin-portal-link" onClick={() => navigate("/login")}>
            ⚙️ Admin Command Center
          </button>
        </div>
      </div>

      <div className="map-container">
        <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {location && (
            <Marker position={[location.lat, location.lng]}>
              <Popup>📍 Your Location</Popup>
            </Marker>
          )}
          {ambulance && (
            <Marker position={[ambulance.lat, ambulance.lon]} icon={ambulanceIcon}>
              <Popup>🚑 {ambulance.hospital} Ambulance</Popup>
            </Marker>
          )}
          {location && <ChangeView center={mapCenter} />}
        </MapContainer>
      </div>
    </div>
  );
}

export default PatientPortal;
