// Dashboard.jsx
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

  // ✅ ตรวจสอบการสมัคร Notification ตอนโหลดหน้า
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const existing = await registration.pushManager.getSubscription();
        if (existing) setSubscribed(true);
      });
    }
  }, []);

  // ✅ โหลดข้อมูลครั้งแรกจาก API
  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("❌ Fetch error:", err));
  }, [API_BASE]);

  // ✅ Socket.IO realtime
  useEffect(() => {
    const socket = io(API_BASE);
    socket.on("rain_alert", (newData) => {
      setData((prev) => [newData, ...prev]);
    });
    return () => socket.disconnect();
  }, [API_BASE]);

  // ✅ สมัครแจ้งเตือน
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

  // ❌ ยกเลิกแจ้งเตือน
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

  // ✅ Summary
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
        borderColor: "#009688",
        backgroundColor: "rgba(0, 150, 136, 0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Segoe UI, sans-serif",
        background: "linear-gradient(135deg, #e0f7fa, #f1f8e9)",
        minHeight: "100vh",
      }}
    >
      {/* ปุ่มแจ้งเตือน */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        {!subscribed ? (
          <button
            onClick={subscribe}
            style={{
              padding: "12px 25px",
              background: "linear-gradient(45deg, #26a69a, #66bb6a)",
              color: "#fff",
              border: "none",
              borderRadius: "30px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            ✅ เปิดการแจ้งเตือน
          </button>
        ) : (
          <button
            onClick={unsubscribe}
            style={{
              padding: "12px 25px",
              background: "linear-gradient(45deg, #ef5350, #e57373)",
              color: "#fff",
              border: "none",
              borderRadius: "30px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            🚫 ปิดการแจ้งเตือน
          </button>
        )}
      </div>

      {/* การ์ดสรุป */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "#b2ebf2",
            padding: "25px",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ margin: 0, color: "#00695c" }}>🌧️ ฝนตกต่อวัน</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold", marginTop: "10px" }}>
            {Object.values(rainCountByDay).slice(-1)[0] || 0} ครั้ง
          </p>
        </div>
        <div
          style={{
            background: "#c8e6c9",
            padding: "25px",
            borderRadius: "15px",
            textAlign: "center",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h4 style={{ margin: 0, color: "#1b5e20" }}>📅 ฝนตกต่อเดือน</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold", marginTop: "10px" }}>
            {Object.values(rainCountByMonth).slice(-1)[0] || 0} ครั้ง
          </p>
        </div>
      </div>

      {/* ตารางข้อมูล */}
      <div
        style={{
          background: "#fff",
          borderRadius: "15px",
          padding: "20px",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#009688", marginTop: 0 }}>📋 ข้อมูลล่าสุด</h3>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#e0f2f1", color: "#004d40" }}>
                <th style={{ padding: "10px" }}>เวลา</th>
                <th>อุณหภูมิ (°C)</th>
                <th>ความชื้น (%)</th>
                <th>ฝนตก</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 30).map((d, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor: i % 2 ? "#f9f9f9" : "#ffffff",
                    textAlign: "center",
                  }}
                >
                  <td>
                    {d.timestamp ? new Date(d.timestamp).toLocaleString() : "N/A"}
                  </td>
                  <td>{d.temperature ?? "-"}</td>
                  <td>{d.humidity ?? "-"}</td>
                  <td>{d.rain_detected ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* กราฟ */}
      <div
        style={{
          background: "#fff",
          borderRadius: "15px",
          padding: "20px",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#009688", marginTop: 0 }}>📊 กราฟฝนตกต่อวัน</h3>
        <Line data={chartData} />
      </div>

      {/* ตารางช่วงเวลา */}
      <div
        style={{
          background: "#fff",
          borderRadius: "15px",
          padding: "20px",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#009688", marginTop: 0 }}>⏰ สรุปตามช่วงเวลา</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#e0f2f1", color: "#004d40" }}>
              <th style={{ padding: "10px" }}>ช่วงเวลา</th>
              <th>จำนวนฝนตก (ครั้ง)</th>
              <th>อุณหภูมิเฉลี่ย (°C)</th>
              <th>ความชื้นเฉลี่ย (%)</th>
            </tr>
          </thead>
          <tbody>
            {timeSlotSummary.map((slot, i) => (
              <tr
                key={i}
                style={{
                  backgroundColor: i % 2 ? "#f9f9f9" : "#ffffff",
                  textAlign: "center",
                }}
              >
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
      <div style={{ textAlign: "center" }}>
        <h3 style={{ color: "#009688" }}>📱 เปิด Dashboard บนมือถือ</h3>
        <QRCodeCanvas
          value="https://rain-frontend.onrender.com"
          size={180}
          fgColor="#004d40"
          bgColor="#e0f2f1"
          level="H"
          includeMargin={true}
        />
        <p style={{ fontSize: "13px", color: "#555" }}>
          สแกนเพื่อดู Dashboard และเปิดการแจ้งเตือน
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
