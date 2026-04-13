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
  
  if (!location || !location.lat || !location.lng) {
    return res.status(400).json({ error: "Invalid location data" });
  }

  console.log(`Request from ${name} (${phone}) at ${location.lat}, ${location.lng}`);

  const hospitals = await fetchNearbyHospitals(location.lat, location.lng);
  console.log(`Found ${hospitals.length} hospitals nearby.`);
  
  if (hospitals.length === 0) {
    return res.status(404).json({ message: "No hospitals found nearby 🚑" });
  }

  // Limit to top 10 hospitals by straight-line distance to avoid API overload
  const topHospitals = hospitals.slice(0, 10);
  console.log(`Calculating road routes for top ${topHospitals.length} hospitals...`);

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