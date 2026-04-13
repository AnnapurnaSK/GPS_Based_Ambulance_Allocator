import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(null);
  const [ambulance, setAmbulance] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    setStatus("📍 Detecting your coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(coords);
        setStatus("✅ Location captured.");
      },
      (err) => {
        console.error(err);
        setStatus("❌ Location permission denied. Using default (London).");
        // Fallback to a default location for demo if needed
        setLocation({ lat: 51.505, lng: -0.09 });
      }
    );
  };

  const requestAmbulance = async () => {
    if (!name || !phone || !location) {
      alert("Please fill in all details and capture your location first! 🚨");
      return;
    }

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
        setStatus(`✅ ${data.message} (${data.ambulance.distance} km away, ~${data.ambulance.duration} mins)`);
      } else {
        setStatus(`❌ ${data.message || "Could not find an ambulance."}`);
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Server error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = location ? [location.lat, location.lng] : [20, 0];
  const zoom = location ? 13 : 2;

  return (
    <div className="app-wrapper">
      <div className="sidebar">
        <div className="card">
          <div className="branding">
            <h1>🚑 Emergency</h1>
            <p className="subtitle">Ambulance Allocator v1.0</p>
          </div>

          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="+1 234 567 890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button className="location-btn" onClick={getLocation} disabled={loading}>
            {location ? "📍 Location Captured" : "📍 Get My Location"}
          </button>

          <button 
            className={`main-btn ${loading ? 'loading' : ''}`} 
            onClick={requestAmbulance} 
            disabled={loading || !location}
          >
            {loading ? "Allocating..." : "🚑 Request Ambulance"}
          </button>

          {status && (
            <div className={`status-box ${status.startsWith('❌') ? 'error' : 'success'}`}>
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
                <div className="result-item">
                  <span className="label">📍 Coordinates</span>
                  <span className="value">{ambulance.lat.toFixed(6)}, {ambulance.lon.toFixed(6)}</span>
                </div>
                <div className="result-item">
                  <span className="label">📏 Distance</span>
                  <span className="value">{ambulance.distance} km</span>
                </div>
                <div className="result-item">
                  <span className="label">⏱️ Estimated Time</span>
                  <span className="value">{ambulance.duration} mins</span>
                </div>
              </div>

              <button className="reset-btn" onClick={() => setAmbulance(null)}>
                Clear Result
              </button>
            </div>
          )}
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

export default App;