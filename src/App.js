// App.js
import React, { useEffect, useState } from "react";
import Dashboard from "./Dashboard";

function App() {
  const [data, setData] = useState([]);
  const API_BASE = "https://rain-backend.onrender.com"; // 👉 backend URL จริง

  // โหลดข้อมูลจาก backend
  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("❌ Error fetching data:", err));
  }, []);

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>🌦 Rain Monitoring Dashboard</h1>
      <Dashboard data={data} />
    </div>
  );
}

export default App;
