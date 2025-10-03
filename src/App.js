// App.js
import React, { useEffect, useState } from "react";
import Dashboard from "./Dashboard";

function App() {
  const [data, setData] = useState([]);
  const API_BASE = process.env.REACT_APP_API_BASE || "https://rain-backend.onrender.com";

  // 🔑 Helper: แปลง VAPID Key
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // โหลดข้อมูลจาก backend
  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("❌ Error fetching data:", err));
  }, [API_BASE]);

  // ✅ ฟังก์ชันเปิด Notification
  function enableNotification() {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        navigator.serviceWorker.ready.then(async (registration) => {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.REACT_APP_VAPID_PUBLIC_KEY
            ),
          });

          await fetch(`${API_BASE}/subscribe`, {
            method: "POST",
            body: JSON.stringify(subscription),
            headers: { "Content-Type": "application/json" },
          });

          alert("✅ เปิดการแจ้งเตือนแล้ว");
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
