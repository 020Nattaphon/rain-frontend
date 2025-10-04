// src/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { QRCodeCanvas } from "qrcode.react";
import { io } from "socket.io-client";

function Dashboard({ initialData }) {
  const [data, setData] = useState(initialData || []);
  const [subscribed, setSubscribed] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE;

  // 🔑 Helper: Base64 → Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  // ✅ ตรวจสอบ subscription ตอนเข้าเว็บใหม่
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const existing = await registration.pushManager.getSubscription();
        if (existing) setSubscribed(true);
      });
    }
  }, []);

  // ✅ โหลดข้อมูลจาก API ครั้งแรก
  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("❌ Fetch error:", err));
  }, [API_BASE]);

  // ✅ Realtime ด้วย Socket.IO
  useEffect(() => {
    const socket = io(API_BASE);
    socket.on("rain_alert", (newData) => {
      setData((prev) => [newData, ...prev]);
    });
    return () => socket.disconnect();
  }, [API_BASE]);

  // ✅ เปิดแจ้งเตือน
  async function subscribe() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("❌ ไม่ได้รับอนุญาตแจ้งเตือน");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
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

    setSubscribed(true);
    alert("✅ เปิดการแจ้งเตือนแล้ว");
  }

  // ❌ ปิดแจ้งเตือน
  async function unsubscribe() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await fetch(`${API_BASE}/unsubscribe`, {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: { "Content-Type": "application/json" },
      });
      alert("🚫 ปิดการแจ้งเตือนแล้ว");
    }
    setSubscribed(false);
  }

  if (!data || data.length === 0) {
    return <p style={{ textAlign: "center" }}>⏳ กำลังโหลดข้อมูล...</p>;
  }

  // ✅ คำนวณสถิติ
  const rainCountByDay = {};
  const rainCountByMonth = {};
  const timeSlots = Array.from({ length: 10 }, (_, i) => ({
    label: `${7 + i}:00-${8 + i}:00`,
    count: 0,
    tempSum: 0,
    humSum: 0,
    entries: 0,
  }));

  data.forEach((item) => {
    if (!item.timestamp) return;
    const day = new Date(item.timestamp).toLocaleDateString();
    const month = new Date(item.timestamp).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (item.rain_detected) {
      rainCountByDay[day] = (rainCountByDay[day] || 0) + 1;
      rainCountByMonth[month] = (rainCountByMonth[month] || 0) + 1;
    }

    const hour = new Date(item.timestamp).getHours();
    if (hour >= 7 && hour < 17) {
      const slotIndex = hour - 7;
      if (item.rain_detected) timeSlots[slotIndex].count++;
      timeSlots[slotIndex].tempSum += item.temperature || 0;
      timeSlots[slotIndex].humSum += item.humidity || 0;
      timeSlots[slotIndex].entries++;
    }
  });

  const timeSlotSummary = timeSlots.map((slot) => ({
    ...slot,
    avgTemp: slot.entries > 0 ? (slot.tempSum / slot.entries).toFixed(1) : "-",
    avgHum: slot.entries > 0 ? (slot.humSum / slot.entries).toFixed(1) : "-",
  }));

  const chartData = {
    labels: Object.keys(rainCountByDay),
    datasets: [
      {
        label: "จำนวนครั้งที่ฝนตกต่อวัน",
        data: Object.values(rainCountByDay),
        borderColor: "blue",
        backgroundColor: "rgba(0, 0, 255, 0.2)",
        tension: 0.2,
      },
    ],
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2 style={{ textAlign: "center" }}>🌦 Rain Monitoring Dashboard</h2>

      {/* ปุ่มแจ้งเตือน */}
      <div style={{ textAlign: "center", margin: "20px" }}>
        {!subscribed ? (
          <button
            onClick={subscribe}
            style={{
              padding: "10px 20px",
              background: "green",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
            }}
          >
            ✅ เปิดการแจ้งเตือน
          </button>
        ) : (
          <button
            onClick={unsubscribe}
            style={{
              padding: "10px 20px",
              background: "red",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
            }}
          >
            🚫 ปิดการแจ้งเตือน
          </button>
        )}
      </div>

      {/* ตาราง + สรุป */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* ตารางข้อมูล */}
        <div>
          <h3>📋 ข้อมูลล่าสุด</h3>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            <table
              border="1"
              cellPadding="5"
              style={{ borderCollapse: "collapse", width: "100%", fontSize: "14px" }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th>เวลา</th>
                  <th>อุณหภูมิ (°C)</th>
                  <th>ความชื้น (%)</th>
                  <th>ฝนตก</th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((d, i) => (
                  <tr key={i}>
                    <td>{d.timestamp ? new Date(d.timestamp).toLocaleString() : "N/A"}</td>
                    <td>{d.temperature ?? "-"}</td>
                    <td>{d.humidity ?? "-"}</td>
                    <td>{d.rain_detected ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* การ์ดสรุป */}
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: "10px" }}>
          <div
            style={{
              background: "#e3f2fd",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            <h4>🌧️ ฝนตกต่อวัน</h4>
            <p style={{ fontSize: "20px", fontWeight: "bold" }}>
              {Object.values(rainCountByDay).slice(-1)[0] || 0} ครั้ง
            </p>
          </div>
          <div
            style={{
              background: "#ffe0b2",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            <h4>📅 ฝนตกต่อเดือน</h4>
            <p style={{ fontSize: "20px", fontWeight: "bold" }}>
              {Object.values(rainCountByMonth).slice(-1)[0] || 0} ครั้ง
            </p>
          </div>
        </div>
      </div>

      {/* กราฟ */}
      <div style={{ marginTop: "30px" }}>
        <h3>📊 กราฟจำนวนครั้งที่ฝนตกต่อวัน</h3>
        <Line data={chartData} />
      </div>

      {/* ตารางช่วงเวลา */}
      <div style={{ marginTop: "30px" }}>
        <h3>⏰ สรุปตามช่วงเวลา (07:00–17:00)</h3>
        <table
          border="1"
          cellPadding="5"
          style={{ borderCollapse: "collapse", width: "100%", fontSize: "14px" }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th>ช่วงเวลา</th>
              <th>จำนวนฝนตก (ครั้ง)</th>
              <th>อุณหภูมิเฉลี่ย (°C)</th>
              <th>ความชื้นเฉลี่ย (%)</th>
            </tr>
          </thead>
          <tbody>
            {timeSlotSummary.map((slot, i) => (
              <tr key={i}>
                <td>{slot.label}</td>
                <td>{slot.count}</td>
                <td>{slot.avgTemp}</td>
                <td>{slot.avgHum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Code */}
      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <h3>📱 สแกน QR Code เพื่อเปิดบนมือถือ</h3>
        <QRCodeCanvas
          value="https://rain-frontend.onrender.com"
          size={200}
          fgColor="#000000"
          bgColor="#ffffff"
          level="H"
          includeMargin={true}
        />
        <p>สแกนเพื่อดู Dashboard และเปิดการแจ้งเตือน</p>
      </div>
    </div>
  );
}

export default Dashboard;
