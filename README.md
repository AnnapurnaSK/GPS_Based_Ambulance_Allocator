# GPS Based Ambulance Allocator

GPS Based Ambulance Allocator is a Node.js and MongoDB project that helps assign the most suitable available ambulance to a patient using GPS coordinates. It combines a public emergency request flow, an admin dashboard for fleet management, route-based ambulance selection, and email notifications for both the patient and the assigned driver.

The main idea behind the project is simple: in an emergency, the system should not assign an ambulance manually or randomly. It should identify the ambulance that can reach the patient fastest based on its current GPS location and present availability.

## Why this project was done

This project addresses a real operational problem in emergency response systems:

- Manual ambulance assignment can waste time.
- The closest ambulance by straight-line distance is not always the fastest one by road.
- Fleet availability needs to be tracked in one place.
- Patients and drivers both need immediate confirmation once an ambulance is assigned.

The project was built as a prototype to show how GPS data, routing, backend APIs, and a small admin workflow can work together to reduce dispatch delay and improve coordination.

## What the project does

The system currently provides these core features:

- Accepts an ambulance request with patient name, contact, email, latitude, and longitude.
- Looks up all available ambulances stored in MongoDB.
- Uses OSRM routing to estimate road travel duration from each ambulance to the patient.
- Selects the best ambulance based on the shortest estimated travel time.
- Sends email notifications to the patient and the assigned driver.
- Stores the patient request in the database.
- Marks the selected ambulance as unavailable until the ride is closed.
- Provides an admin login and dashboard to add, view, update, search, and delete driver records.

## How the project works

### 1. Public ambulance request

The public-facing interface is served from `frontend/home`. A patient can:

- enter their personal details,
- allow the browser to capture current GPS location, or
- manually enter latitude and longitude.

That form sends a `POST` request to:

```text
/user/api/request-ambulance
```

Expected payload:

```json
{
  "lat": 14.46751,
  "lon": 75.92090,
  "name": "Rohan",
  "contact": "9876543210",
  "email": "patient@example.com"
}
```

### 2. Driver search and allocation

When a request reaches the backend:

1. The server validates that all required request fields are present.
2. It fetches drivers whose status is `available`.
3. For each available driver, it calls the OSRM routing service:

```text
https://router.project-osrm.org/route/v1/driving/{driverLon},{driverLat};{patientLon},{patientLat}?overview=false
```

4. It compares the returned route durations.
5. It picks the driver with the lowest estimated travel time.

This means the project does not only use raw distance. It uses road-route duration, which is a better approximation for emergency dispatch.

### 3. Notification flow

After allocation:

- the patient receives an email with ambulance and driver details,
- the driver receives the patient details and a Google Maps location link,
- the selected driver is updated in MongoDB so the vehicle is no longer available for a new request.

### 4. Ride closure

The patient email includes a secure close link. When that link is opened:

- the backend verifies a JWT token,
- the assigned vehicle is found by `vehicleNumber`,
- the driver status is switched back to available.

Route:

```text
GET /user/api/close?token=...
```

### 5. Admin management

Admins use the protected UI in `frontend/admin` to manage the ambulance fleet.

The admin flow includes:

- login using credentials from `.env`,
- JWT-based access protection,
- creating new driver records,
- viewing all drivers,
- searching a driver by vehicle number,
- updating driver location and status,
- deleting old driver records.

Important admin routes:

```text
POST   /admin/api/login
GET    /admin/api/getAllDrivers
GET    /admin/api/getDriverByVehicleNumber/:vehicleNumber
POST   /admin/api/insertDriver
PUT    /admin/api/updateDriver/:vehicleNumber
DELETE /admin/api/deleteDriver/:vehicleNumber
```

## Architecture overview

### Backend

- `index.js`
  Main Express server. Serves the public frontend and mounts user, admin, and driver routes.
- `backend/api/user_api.js`
  Handles ambulance requests and ride closure.
- `backend/api/admin_api.js`
  Handles driver CRUD operations.
- `backend/controllers/gps.js`
  Finds the best available ambulance using route duration from OSRM.
- `backend/controllers/mail.js`
  Sends email notifications and updates driver status after allocation.
- `backend/middleware/admin_auth.js`
  Handles admin login and token verification.
- `backend/models/drivers.js`
  MongoDB schema for ambulance/driver records.
- `backend/models/users.js`
  MongoDB schema for patient request records.

### Frontend

- `frontend/home`
  Public emergency request page.
- `frontend/admin`
  Admin login page and admin dashboard.

### Database

MongoDB stores:

- driver records,
- ambulance status,
- current ambulance coordinates,
- patient request history.

## Driver data model

Each ambulance/driver entry includes:

- `vehicleNumber`
- `name`
- `contact`
- `email`
- `password`
- `status`
- `location.lat`
- `location.lon`
- `address`

The `status` field is used during allocation to determine whether an ambulance can be assigned.

## Project flow in one view

```text
Patient submits request
        ->
Backend reads patient location
        ->
Fetch all available drivers from MongoDB
        ->
Get route duration for each driver using OSRM
        ->
Choose fastest reachable ambulance
        ->
Send email to patient and driver
        ->
Store request in MongoDB
        ->
Mark driver unavailable
        ->
Close ride later using secure token link
        ->
Mark driver available again
```

## Tech stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Nodemailer
- OSRM routing service
- HTML, CSS, and vanilla JavaScript

## Setup and run

### Prerequisites

- Node.js 18 or later
- MongoDB database
- Gmail account or another mail account configured for Nodemailer

### Environment variables

The project expects these variables in `.env`:

```env
PORT=
MONGO_URL=
JWT_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
EMAIL=
PASSWORD=
```

Notes:

- `EMAIL` and `PASSWORD` are used by Nodemailer.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` protect the admin login.
- `JWT_SECRET` is used for admin authentication and ride-closing links.

### Install dependencies

```bash
npm install
```

### Start the main application

```bash
node index.js
```

The backend and public frontend will be available at:

```text
http://127.0.0.1:3000
```

### Optional: run the separate admin frontend server

There is also a separate server inside `frontend/admin/server.js`.

Run it with:

```bash
npm run admin-frontend
```

That starts the admin frontend on:

```text
http://127.0.0.1:4100
```

In the current codebase, the admin UI can also be accessed directly from the main app at:

```text
http://127.0.0.1:3000/admin
```

## How to use the project

### Patient side

1. Open the home page.
2. Enter patient details.
3. Capture current location or enter coordinates manually.
4. Submit the request.
5. If a driver is available, the system returns the assigned ambulance details and sends email notifications.

### Admin side

1. Open `/admin`.
2. Log in using admin credentials from `.env`.
3. Add ambulance records before testing allocation.
4. Update each driver with current GPS coordinates and status.
5. Use the dashboard to monitor and manage the fleet.

## Example successful response

```json
{
  "status": true,
  "message": "Ambulance allocated successfully",
  "driver": {
    "vehicleNumber": "KA17IJ5555",
    "name": "Arun M",
    "contact": "9456789012",
    "email": "driver@example.com",
    "address": "Vidyanagar, Davangere",
    "distance": 0.4262,
    "duration": 0.0091
  }
}
```

## Future improvements

- Real-time ambulance GPS tracking from driver devices
- Better dashboard analytics and live fleet map
- Hospital-side integration
- SMS/WhatsApp alerts in addition to email
- Password hashing and stronger security controls
- Better driver and trip lifecycle states
- Automated tests for APIs and allocation logic

## Summary

GPS Based Ambulance Allocator is a prototype emergency dispatch system that demonstrates how ambulance assignment can be improved with GPS coordinates, route-based travel estimation, and centralized fleet management. The project was done to reduce response delay, automate ambulance selection, and show a practical way to connect patients, drivers, and administrators in one workflow.
