const express = require("express");
const path = require("path");

const app = express();
const port = process.env.ADMIN_FRONTEND_PORT || 4100;
const staticDir = __dirname;

app.use(express.json());
app.use(express.static(staticDir));

app.all("/proxy/*rest", async (req, res) => {
  const targetBaseUrl = (req.headers["x-target-base-url"] || "").replace(/\/+$/, "");

  if (!targetBaseUrl) {
    return res.status(400).json({
      error: "Missing x-target-base-url header.",
    });
  }

  const restPath = Array.isArray(req.params.rest)
    ? req.params.rest.join("/")
    : req.params.rest || "";
  const targetPath = restPath ? `/${restPath}` : "";
  const targetUrl = `${targetBaseUrl}${targetPath}`;

  const proxyHeaders = {
    "Content-Type": req.headers["content-type"] || "application/json",
  };

  if (req.headers.authorization) {
    proxyHeaders.Authorization = req.headers.authorization;
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: proxyHeaders,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const contentType = upstreamResponse.headers.get("content-type") || "application/json";
    const responseText = await upstreamResponse.text();

    res.status(upstreamResponse.status);
    res.setHeader("content-type", contentType);
    res.send(responseText);
  } catch (error) {
    res.status(502).json({
      error: "Unable to reach backend admin API.",
      details: error.message,
    });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Admin frontend running at http://127.0.0.1:${port}`);
});
