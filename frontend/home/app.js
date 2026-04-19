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

function normalizeGeolocationError(error) {
  if (!error) {
    return "Unable to retrieve your location.";
  }

  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission was denied. Please allow location access and try again.";
    case error.POSITION_UNAVAILABLE:
      return "Your device could not determine a GPS position.";
    case error.TIMEOUT:
      return "Location request timed out. Please retry in an open area or with GPS enabled.";
    default:
      return error.message || "Unable to retrieve your location.";
  }
}

function updateLocationInputs(position) {
  elements.lat.value = position.coords.latitude.toFixed(6);
  elements.lon.value = position.coords.longitude.toFixed(6);
}

function watchForBestPosition() {
  return new Promise((resolve, reject) => {
    let bestPosition = null;
    let settled = false;

    const stopWatcher = (watchId) => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };

    const finalize = (watchId, position, error) => {
      if (settled) {
        return;
      }

      settled = true;
      stopWatcher(watchId);

      if (position) {
        resolve(position);
        return;
      }

      reject(error || new Error("Unable to retrieve your location."));
    };

    const timeoutId = window.setTimeout(() => {
      finalize(watchId, bestPosition, bestPosition ? null : new Error("Unable to retrieve your location."));
    }, 12000);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (
          !bestPosition ||
          position.coords.accuracy < bestPosition.coords.accuracy
        ) {
          bestPosition = position;
          updateLocationInputs(position);
        }

        if (position.coords.accuracy <= 100) {
          window.clearTimeout(timeoutId);
          finalize(watchId, position, null);
        }
      },
      (error) => {
        window.clearTimeout(timeoutId);
        finalize(watchId, bestPosition, error);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
}

async function detectLocation() {
  if (!navigator.geolocation) {
    setStatus("Geolocation unavailable", "status-error");
    renderResponse("Location unavailable", {
      error: "This browser does not support geolocation.",
    });
    return;
  }

  setStatus("Detecting location", "status-working");
  renderResponse("Detecting location", {
    message: "Trying to acquire a fresh GPS fix from your browser.",
  });

  try {
    let position = await requestCurrentPosition({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });

    if ((position.coords.accuracy || Number.POSITIVE_INFINITY) > 100) {
      position = await watchForBestPosition();
    }

    updateLocationInputs(position);

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
      error: normalizeGeolocationError(error),
    });
  }
}

elements.geoButton.addEventListener("click", detectLocation);

window.addEventListener("load", () => {
  window.setTimeout(detectLocation, 600);
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
