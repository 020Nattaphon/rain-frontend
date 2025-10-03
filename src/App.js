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

  // ✅ ฟังก์ชันเปิด Notification
  function enableNotification() {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        navigator.serviceWorker.ready.then(async (registration) => {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: "<VAPID_PUBLIC_KEY>" // 👉 ใส่ PUBLIC KEY จาก web-push
          });

          await fetch(`${API_BASE}/subscribe`, {
            method: "POST",
            body: JSON.stringify(subscription),
            headers: { "Content-Type": "application/json" },
          });
        });
      }
    });
  }

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>🌦 Rain Monitoring Dashboard</h1>
      
      {/* ปุ่มเปิดการแจ้งเตือน */}
      <div style={{ textAlign: "center", margin: "20px" }}>
        <button onClick={enableNotification}>🔔 เปิดการแจ้งเตือน</button>
      </div>

      <Dashboard data={data} />
    </div>
  );
}

export default App;
