import { useState } from "react";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("");

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => alert("Location permission denied ❌")
    );
  };

  const requestAmbulance = () => {
    setStatus("🚑 Searching for nearest ambulance...");
  };

  return (
    <div className="container">
      <div className="card">
        <h1>🚑 Ambulance Allocator</h1>
        <p className="subtitle">Quick emergency response system</p>

        <input
          type="text"
          placeholder="👤 Enter your name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          placeholder="📞 Enter phone number"
          onChange={(e) => setPhone(e.target.value)}
        />

        <button className="location-btn" onClick={getLocation}>
          📍 Get Location
        </button>

        <button className="main-btn" onClick={requestAmbulance}>
          🚑 Request Ambulance
        </button>

        {status && <p className="status">{status}</p>}
      </div>
    </div>
  );
}

export default App;