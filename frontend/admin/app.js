const storageKeys = {
  token: "adminApiToken",
  baseUrl: "adminApiBaseUrl",
  username: "adminApiUsername",
};

const page = document.body.classList.contains("dashboard-body") ? "dashboard" : "login";
const adminBasePath = "/admin";
const homePagePath = "/";

function getToken() {
  return localStorage.getItem(storageKeys.token) || "";
}

function getStoredUsername() {
  return localStorage.getItem(storageKeys.username) || "";
}

function getStoredBaseUrl() {
  return (localStorage.getItem(storageKeys.baseUrl) || "").replace(/\/+$/, "");
}

function setSessionState(element, text, variant) {
  if (!element) {
    return;
  }

  element.textContent = text;
  element.className = `status-pill ${variant}`;
}

function renderResponse(metaElement, viewerElement, title, payload) {
  if (!metaElement || !viewerElement) {
    return;
  }

  metaElement.textContent = `${title} • ${new Date().toLocaleString()}`;
  viewerElement.textContent =
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

async function callApi(path, options = {}) {
  const baseUrl =
    (options.baseUrl || getStoredBaseUrl() || "").replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error("Enter the backend base URL first.");
  }

  localStorage.setItem(storageKeys.baseUrl, baseUrl);

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = token;
  }

  const isSameOriginBackend = !baseUrl || baseUrl === window.location.origin;
  const requestUrl = isSameOriginBackend ? `${adminBasePath}${path.replace("/admin", "")}` : `${baseUrl}${path}`;

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  const data = await parseResponse(response);
  if (!response.ok) {
    const message =
      (data && (data.error || data.msg)) ||
      `Request failed with status ${response.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(data));
  }

  return data;
}

function clearSession() {
  localStorage.removeItem(storageKeys.token);
  localStorage.removeItem(storageKeys.username);
}

function redirectToLogin() {
  window.location.href = `${adminBasePath}`;
}

function redirectToDashboard() {
  window.location.href = `${adminBasePath}/dashboard`;
}

function initLoginPage() {
  const elements = {
    baseUrl: document.getElementById("baseUrl"),
    username: document.getElementById("username"),
    password: document.getElementById("password"),
    loginForm: document.getElementById("loginForm"),
    clearSessionButton: document.getElementById("clearSessionButton"),
    responseMeta: document.getElementById("responseMeta"),
    responseViewer: document.getElementById("responseViewer"),
    sessionState: document.getElementById("sessionState"),
  };

  const token = getToken();
  const storedBaseUrl = getStoredBaseUrl();
  const storedUsername = getStoredUsername();

  if (storedBaseUrl) {
    elements.baseUrl.value = storedBaseUrl;
  } else {
    elements.baseUrl.value = window.location.origin;
  }

  if (storedUsername) {
    elements.username.value = storedUsername;
  }

  if (token) {
    setSessionState(
      elements.sessionState,
      `Authenticated as ${storedUsername || "admin"}`,
      "status-ok"
    );
    renderResponse(elements.responseMeta, elements.responseViewer, "Session restored", {
      message: "Existing admin session found. Redirecting to dashboard...",
    });
    setTimeout(redirectToDashboard, 500);
  } else {
    setSessionState(elements.sessionState, "Signed out", "status-idle");
  }

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = elements.username.value.trim();
    const password = elements.password.value;
    const baseUrl = elements.baseUrl.value.trim();

    try {
      const data = await callApi("/admin/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        baseUrl,
      });

      localStorage.setItem(storageKeys.token, data.token || "");
      localStorage.setItem(storageKeys.username, username);
      elements.password.value = "";
      setSessionState(
        elements.sessionState,
        `Authenticated as ${username}`,
        "status-ok"
      );
      renderResponse(elements.responseMeta, elements.responseViewer, "Login successful", data);
      setTimeout(redirectToDashboard, 350);
    } catch (error) {
      clearSession();
      setSessionState(elements.sessionState, "Login failed", "status-error");
      renderResponse(elements.responseMeta, elements.responseViewer, "Login failed", {
        error: error.message,
      });
    }
  });

  elements.clearSessionButton.addEventListener("click", () => {
    clearSession();
    elements.password.value = "";
    setSessionState(elements.sessionState, "Signed out", "status-idle");
    renderResponse(elements.responseMeta, elements.responseViewer, "Session cleared", {
      message: "Saved admin session removed.",
    });
  });
}

function initDashboardPage() {
  const token = getToken();
  if (!token) {
    redirectToLogin();
    return;
  }

  const elements = {
    sessionState: document.getElementById("sessionState"),
    dashboardTitle: document.getElementById("dashboardTitle"),
    logoutButton: document.getElementById("logoutButton"),
    loadDriversButton: document.getElementById("loadDriversButton"),
    getDriverForm: document.getElementById("getDriverForm"),
    insertDriverForm: document.getElementById("insertDriverForm"),
    updateDriverForm: document.getElementById("updateDriverForm"),
    deleteDriverForm: document.getElementById("deleteDriverForm"),
    clearResponseButton: document.getElementById("clearResponseButton"),
    responseMeta: document.getElementById("responseMeta"),
    responseViewer: document.getElementById("responseViewer"),
    loadUsersButton: document.getElementById("loadUsersButton"),
  };

  const username = getStoredUsername();
  if (elements.dashboardTitle) {
    elements.dashboardTitle.textContent = username
      ? `${username}'s Admin Workspace`
      : "Admin Workspace";
  }

  setSessionState(
    elements.sessionState,
    `Authenticated${username ? ` as ${username}` : ""}`,
    "status-ok"
  );

  elements.logoutButton.addEventListener("click", () => {
    clearSession();
    window.location.href = homePagePath;
  });

  elements.loadDriversButton.addEventListener("click", async () => {
    try {
      const data = await callApi("/admin/api/getAllDrivers");
      renderResponse(elements.responseMeta, elements.responseViewer, "Fetched all drivers", data);
    } catch (error) {
      setSessionState(elements.sessionState, "Request failed", "status-error");
      renderResponse(elements.responseMeta, elements.responseViewer, "Get all drivers failed", {
        error: error.message,
      });
    }
  });

  elements.getDriverForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const vehicleNumber = document.getElementById("searchVehicleNumber").value.trim();

    try {
      const data = await callApi(
        `/admin/api/getDriverByVehicleNumber/${encodeURIComponent(vehicleNumber)}`
      );
      renderResponse(
        elements.responseMeta,
        elements.responseViewer,
        `Fetched driver ${vehicleNumber}`,
        data
      );
    } catch (error) {
      setSessionState(elements.sessionState, "Request failed", "status-error");
      renderResponse(elements.responseMeta, elements.responseViewer, "Get driver failed", {
        error: error.message,
      });
    }
  });

  elements.insertDriverForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      vehicleNumber: document.getElementById("insertVehicleNumber").value.trim(),
      name: document.getElementById("insertName").value.trim(),
      contact: document.getElementById("insertContact").value.trim(),
      email: document.getElementById("insertEmail").value.trim(),
      password: document.getElementById("insertPassword").value,
      address: document.getElementById("insertAddress").value.trim(),
    };

    try {
      const data = await callApi("/admin/api/insertDriver", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      renderResponse(
        elements.responseMeta,
        elements.responseViewer,
        `Inserted driver ${payload.vehicleNumber}`,
        data
      );
      elements.insertDriverForm.reset();
    } catch (error) {
      setSessionState(elements.sessionState, "Request failed", "status-error");
      renderResponse(elements.responseMeta, elements.responseViewer, "Insert driver failed", {
        error: error.message,
      });
    }
  });

  elements.updateDriverForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const vehicleNumber = document.getElementById("updateVehicleNumber").value.trim();
    const payload = {
      lat: Number(document.getElementById("updateLat").value),
      lon: Number(document.getElementById("updateLon").value),
      status: document.getElementById("updateStatus").value.trim(),
    };

    try {
      const data = await callApi(
        `/admin/api/updateDriver/${encodeURIComponent(vehicleNumber)}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );
      renderResponse(
        elements.responseMeta,
        elements.responseViewer,
        `Updated driver ${vehicleNumber}`,
        data
      );
      elements.updateDriverForm.reset();
    } catch (error) {
      setSessionState(elements.sessionState, "Request failed", "status-error");
      renderResponse(elements.responseMeta, elements.responseViewer, "Update driver failed", {
        error: error.message,
      });
    }
  });

  elements.deleteDriverForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const vehicleNumber = document.getElementById("deleteVehicleNumber").value.trim();

    try {
      const data = await callApi(`/admin/api/deleteDriver/${encodeURIComponent(vehicleNumber)}`, {
        method: "DELETE",
      });
      renderResponse(
        elements.responseMeta,
        elements.responseViewer,
        `Deleted driver ${vehicleNumber}`,
        data
      );
      elements.deleteDriverForm.reset();
    } catch (error) {
      setSessionState(elements.sessionState, "Request failed", "status-error");
      renderResponse(elements.responseMeta, elements.responseViewer, "Delete driver failed", {
        error: error.message,
      });
    }
  });

    elements.loadUsersButton.addEventListener("click", async () => {
      try {
        const data = await callApi("/admin/api/getAllUsers");
        renderResponse(elements.responseMeta, elements.responseViewer, "Fetched all users", data);
      } catch (error) {
        setSessionState(elements.sessionState, "Request failed", "status-error");
        renderResponse(elements.responseMeta, elements.responseViewer, "Get all users failed", {
          error: error.message,
        });
      }
    });

  elements.clearResponseButton.addEventListener("click", () => {
    renderResponse(elements.responseMeta, elements.responseViewer, "Responses cleared", {
      message: "Awaiting the next dashboard action.",
    });
  });
}

if (page === "dashboard") {
  initDashboardPage();
} else {
  initLoginPage();
}
