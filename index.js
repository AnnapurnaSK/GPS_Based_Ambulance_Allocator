const express = require("express");
const cors = require("cors");
const { navigate } = require("./backend/controllers/gps");

const app = express();
app.use(cors());
app.use(express.json());

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
  
  // 1. Validate Name
  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({ error: "Invalid name. Minimum 3 characters required." });
  }

  // 2. Validate Indian Phone Number (10 digits starting with 6-9)
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits for checking
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({ error: "Invalid Indian mobile number. Must be 10 digits starting with 6-9." });
  }

  // 3. Validate Location
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return res.status(400).json({ error: "Invalid location data." });
  }

  if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
    return res.status(400).json({ error: "Coordinates out of valid earth range." });
  }

  console.log(`Request from ${name} (${phone}) at ${location.lat}, ${location.lng}`);

  let hospitals = [];
  let currentRadius = 5000;
  const radii = [5000, 10000, 25000, 50000];

  for (const r of radii) {
    console.log(`Searching for hospitals within ${r}m...`);
    hospitals = await fetchNearbyHospitals(location.lat, location.lng, r);
    if (hospitals.length > 0) {
      currentRadius = r;
      break;
    }
  }
  
  if (hospitals.length === 0) {
    return res.status(404).json({ error: "No hospitals found within 50km search radius. 🚑" });
  }

  console.log(`Found ${hospitals.length} hospitals within ${currentRadius}m.`);

  // Limit to top 10 hospitals by straight-line distance to avoid API overload
  const topHospitals = hospitals.slice(0, 10);
  console.log(`Calculating road routes for top ${topHospitals.length} units...`);

  // Parallelize the route calculations for better performance
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
        duration: (nearest.duration * 60).toFixed(1), // convert to minutes
        lat: nearest.lat,
        lon: nearest.lon
      }
    });
  } else {
    res.status(500).json({ message: "Could not calculate route to any nearby hospital" });
  }
});

// Existing code
app.listen(5000, () => {
  console.log("Server running on 127.0.0.1:5000");
});