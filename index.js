const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const { navigate } = require("./backend/controllers/gps");

// System files from owner
const user_routs = require("./backend/routers/user_routs");
const admin_routes = require("./backend/routers/admin_routs");
const driver_routes = require("./backend/routers/driver_routs");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Owner's original routes
app.use("/user", user_routs);
app.use("/admin", admin_routes);
app.use("/driver", driver_routes);

// 2. Our enhanced Ambulance Allocator logic (Syncing with owner's system)
// Helper to fetch nearby hospitals using Overpass API
async function fetchNearbyHospitals(lat, lon, radius = 5000) {
  const query = `
    [out:json];
    node["amenity"="hospital"](around:${radius},${lat},${lon});
    out body;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.elements.map(el => ({
      id: el.id,
      name: el.tags.name || "Unnamed Hospital",
      lat: el.lat,
      lon: el.lon
    }));
  } catch (error) {
    console.error("Overpass API error:", error);
    return [];
  }
}

app.post("/allocate", async (req, res) => {
  const { name, phone, location } = req.body;
  
  // Validation (Indian localization)
  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({ error: "Invalid name. Minimum 3 characters required." });
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = (phone || "").replace(/\D/g, '');
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({ error: "Invalid Indian mobile number. Must be 10 digits starting with 6-9." });
  }

  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return res.status(400).json({ error: "Invalid location data." });
  }

  console.log(`Allocation request from ${name} (${phone}) at ${location.lat}, ${location.lng}`);

  let hospitals = [];
  let currentRadius = 5000;
  const radii = [5000, 10000, 25000, 50000];

  for (const r of radii) {
    hospitals = await fetchNearbyHospitals(location.lat, location.lng, r);
    if (hospitals.length > 0) {
      currentRadius = r;
      break;
    }
  }
  
  if (hospitals.length === 0) {
    return res.status(404).json({ error: "No hospitals found within 50km search radius. 🚑" });
  }

  // Parallelize the route calculations
  const topHospitals = hospitals.slice(0, 10);
  const routePromises = topHospitals.map(async (hospital) => {
    const route = await navigate(location.lat, location.lng, hospital.lat, hospital.lon);
    return { ...hospital, ...route };
  });

  const results = await Promise.all(routePromises);
  let nearest = null;
  let minDistance = Infinity;

  for (const result of results) {
    if (result.status && result.distance < minDistance) {
      minDistance = result.distance;
      nearest = result;
    }
  }

  if (nearest) {
    res.json({
      message: `Ambulance allocated from ${nearest.name} 🚑`,
      ambulance: {
        id: nearest.id,
        hospital: nearest.name,
        distance: nearest.distance.toFixed(2),
        duration: (nearest.duration * 60).toFixed(1),
        lat: nearest.lat,
        lon: nearest.lon
      }
    });
  } else {
    res.status(500).json({ message: "Could not calculate route to any nearest hospital" });
  }
});

// Root default route
app.use("/", (req, res) => {
  res.json({ status: "Ambulance Allocator API Live", current_time: new Date() });
});

// Mongo DB connection and Server Start
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/ambulance_allocator";

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Unable to connect to database!");
    console.error(err);
    // Continue running even if DB fails for testing purposes (Optional)
    app.listen(PORT, () => {
      console.log(`Server running on http://127.0.0.1:${PORT} (Offline Mode)`);
    });
  });