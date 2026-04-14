# GPS-Based Ambulance Allocator

A full-stack emergency response project focused on assigning the most suitable ambulance using GPS-aware logic, centralized fleet management, and a lightweight request interface.

This repository combines:

- A Node.js + Express backend for ambulance and driver administration
- A MongoDB data layer for fleet records
- JWT-protected admin operations
- A React frontend for ambulance request initiation
- A GPS routing prototype for nearest-ambulance search

## Overview

The goal of this project is to reduce emergency response time by improving how ambulances are tracked, managed, and allocated. Instead of relying only on manual dispatching, the system is designed to support location-based allocation and live status updates for ambulance availability.

While the complete dispatcher workflow is still evolving, the current codebase already includes the core building blocks needed for a practical emergency allocation system.

## Current Capabilities

### Backend

- Admin login with JWT token generation
- Protected admin APIs for ambulance/driver management
- Create, read, update, and delete driver records
- Driver status tracking (`available`, `dispatched`, `maintenance`)
- Driver location updates using latitude and longitude coordinates
- MongoDB persistence using Mongoose

### Frontend

- Simple emergency request form
- Browser geolocation capture
- Request initiation flow for ambulance search

### GPS Logic Prototype

- Coordinate validation
- Travel distance and duration lookup using OSRM
- Nearest-point selection based on routing duration

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Token (JWT)
- **Environment Management:** dotenv
- **Routing Engine Prototype:** OSRM public routing service

## Project Structure

```text
GPS_Based_Ambulance_Allocator/
├── backend/
│   ├── api/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routers/
├── frontend/
│   ├── public/
│   └── src/
├── index.js
├── package.json
└── README.md
```

## Implemented API Endpoints

Base URL examples below assume the backend runs locally on `http://localhost:3000`.

### Public

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health/default response |
| `POST` | `/admin/api/login` | Authenticate admin and receive JWT |
| `GET` | `/user/` | User default route |
| `GET` | `/driver/` | Driver default route |

### Admin-Protected

Include the admin JWT in the `Authorization` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/api/getAllDrivers` | Fetch all drivers/ambulances |
| `GET` | `/admin/api/getDriverByVehicleNumber/:vehicleNumber` | Fetch a specific driver |
| `POST` | `/admin/api/insertDriver` | Add a new driver/ambulance record |
| `PUT` | `/admin/api/updateDriver/:vehicleNumber` | Update location and status |
| `DELETE` | `/admin/api/deleteDriver/:vehicleNumber` | Remove a driver record |

## Driver Data Model

The current backend stores each ambulance/driver entry with fields similar to:

- `vehicleNumber`
- `name`
- `contact`
- `email`
- `password`
- `status`
- `location.lat`
- `location.lon`
- `address`
- `assigned_to.lat`
- `assigned_to.lon`

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB instance or MongoDB Atlas connection string

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd GPS_Based_Ambulance_Allocator
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

### 4. Start the Backend

```bash
node index.js
```

The Express API will start after a successful MongoDB connection.

### 5. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 6. Start the Frontend

```bash
npm start
```

The frontend development server will typically run on `http://localhost:3000` unless the port is already in use.

## Example Admin Login Request

```http
POST /admin/api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin-password"
}
```

## Example Driver Insert Payload

```json
{
  "vehicleNumber": "KA-01-AB-1234",
  "name": "Driver One",
  "contact": "9876543210",
  "email": "driver@example.com",
  "password": "secure-password",
  "address": "City Hospital Garage"
}
```

## Development Status

This project is currently best described as a functional prototype with core backend operations in place. The repository already demonstrates:

- Secure admin access
- Fleet record management
- GPS-based routing experimentation
- A basic patient-side request interface

Areas that can be expanded next include:

- Connecting the frontend request flow to backend allocation APIs
- Persisting live ambulance assignment workflows
- Adding driver authentication and driver-facing actions
- Integrating real-time tracking with sockets or polling
- Improving validation, error handling, and automated tests
- Hardening security for production deployment

## Presentation Notes

This project is well-suited for:

- Final-year engineering presentations
- healthcare logistics demos
- smart city or emergency response prototypes
- system design and full-stack portfolio showcases
