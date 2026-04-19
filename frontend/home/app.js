const elements = {
  baseUrl: document.getElementById("baseUrl"),
  name: document.getElementById("name"),
  contact: document.getElementById("contact"),
  email: document.getElementById("email"),
  lat: document.getElementById("lat"),
  lon: document.getElementById("lon"),
  geoButton: document.getElementById("geoButton"),
  form: document.getElementById("ambulanceForm"),
  responseMeta: document.getElementById("responseMeta"),
  responseViewer: document.getElementById("responseViewer"),
  statusBadge: document.getElementById("statusBadge"),
};

function setStatus(text, variant) {
  elements.statusBadge.textContent = text;
  elements.statusBadge.className = `status-badge ${variant}`;
}

function renderResponse(title, payload) {
  elements.responseMeta.textContent = `${title} • ${new Date().toLocaleString()}`;
  elements.responseViewer.textContent =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text;
  }
}

function requestCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function getBestAvailablePosition() {
  const attempts = [
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    },
  ];

  let bestPosition = null;
  let lastError = null;

  for (const options of attempts) {
    try {
      const position = await requestCurrentPosition(options);
      if (
        !bestPosition ||
        position.coords.accuracy < bestPosition.coords.accuracy
      ) {
        bestPosition = position;
      }

      if (position.coords.accuracy <= 100) {
        return position;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (bestPosition) {
    return bestPosition;
  }

  throw lastError || new Error("Unable to retrieve your location.");
}

elements.geoButton.addEventListener("click", async () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation unavailable", "status-error");
    renderResponse("Location unavailable", {
      error: "This browser does not support geolocation.",
    });
    return;
  }

  setStatus("Detecting location", "status-working");

  try {
    const position = await getBestAvailablePosition();
    elements.lat.value = position.coords.latitude.toFixed(6);
    elements.lon.value = position.coords.longitude.toFixed(6);

    const accuracy = Math.round(position.coords.accuracy || 0);
    const accuracyState = accuracy > 1000 ? "status-error" : "status-success";
    const accuracyText =
      accuracy > 1000 ? "Location looks inaccurate" : "Location captured";

    setStatus(accuracyText, accuracyState);
    renderResponse("Location captured", {
      lat: Number(elements.lat.value),
      lon: Number(elements.lon.value),
      accuracyInMeters: accuracy,
      note:
        accuracy > 1000
          ? "Your browser returned a coarse location estimate. This often happens on desktops or when GPS/high-accuracy location is disabled."
          : "High-accuracy coordinates captured successfully.",
    });
  } catch (error) {
    setStatus("Location blocked", "status-error");
    renderResponse("Location failed", {
      error: error.message || "Unable to retrieve your location.",
    });
  }
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const baseUrl = (elements.baseUrl.value || window.location.origin).replace(/\/+$/, "");
  const payload = {
    lat: Number(elements.lat.value),
    lon: Number(elements.lon.value),
    name: elements.name.value.trim(),
    contact: elements.contact.value.trim(),
    email: elements.email.value.trim(),
  };

  setStatus("Requesting ambulance", "status-working");
  renderResponse("Sending request", payload);

  try {
    const response = await fetch(`${baseUrl}/user/api/request-ambulance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await parseResponse(response);
    if (!response.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    setStatus("Ambulance allocated", "status-success");
    renderResponse("Request completed", data);
  } catch (error) {
    setStatus("Request failed", "status-error");
    renderResponse("Request failed", {
      error: error.message,
    });
  }
});
