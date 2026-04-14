import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PatientPortal from "./PatientPortal";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Patient Portal (Main View) */}
        <Route path="/" element={<PatientPortal />} />

        {/* Admin Section */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;