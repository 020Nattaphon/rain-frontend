// src/App.js
import React, { useEffect, useState } from "react";
import Dashboard from "./Dashboard";

function App() {
  const [data, setData] = useState([]);
  const API_BASE = process.env.REACT_APP_API_BASE;

  // โหลดข้อมูลจาก backend
  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("❌ Error fetching data:", err));
  }, [API_BASE]);

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>🌦 Rain Monitoring Dashboard</h1>
      <Dashboard initialData={data} />
    </div>
  );
}

export default App;
