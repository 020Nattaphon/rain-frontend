import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { QRCodeCanvas } from "qrcode.react";
import { io } from "socket.io-client";

function Dashboard({ initialData }) {
  const [data, setData] = useState(initialData || []);
  const [subscribed, setSubscribed] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE;

  // Helper: แปลง Base64 → Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  // ตรวจสอบ subscription ตอนโหลด
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const existing = await registration.pushManager.getSubscription();
        setSubscribed(!!existing);
      });
    }
  }, []);

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("❌ Fetch error:", err));
  }, [API_BASE]);

  // Socket.IO เรียลไทม์
  useEffect(() => {
    const socket = io(API_BASE);
    socket.on("rain_alert", (newData) => setData((prev) => [newData, ...prev]));
    return () => socket.disconnect();
  }, [API_BASE]);

  // เปิดการแจ้งเตือน
  async function subscribe() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return alert("❌ ไม่อนุญาตแจ้งเตือน");

    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
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

  // ปิดการแจ้งเตือน
  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await fetch(`${API_BASE}/unsubscribe`, {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: { "Content-Type": "application/json" },
      });
    }
    setSubscribed(false);
    alert("🚫 ปิดการแจ้งเตือนแล้ว");
  }

  if (!data || data.length === 0) {
    return <p className="text-center">⏳ กำลังโหลดข้อมูล...</p>;
  }

  // --- Data Summary ---
  const rainByDay = {};
  const rainByMonth = {};
  data.forEach((d) => {
    if (!d.timestamp) return;
    const day = new Date(d.timestamp).toLocaleDateString();
    const month = new Date(d.timestamp).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (d.rain_detected) {
      rainByDay[day] = (rainByDay[day] || 0) + 1;
      rainByMonth[month] = (rainByMonth[month] || 0) + 1;
    }
  });

  const chartData = {
    labels: Object.keys(rainByDay),
    datasets: [
      {
        label: "จำนวนครั้งที่ฝนตกต่อวัน",
        data: Object.values(rainByDay),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
        🌦 Rain Monitoring Dashboard
      </h2>

      {/* ปุ่มแจ้งเตือน */}
      <div className="flex justify-center mb-6">
        {!subscribed ? (
          <button
            onClick={subscribe}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md"
          >
            ✅ เปิดการแจ้งเตือน
          </button>
        ) : (
          <button
            onClick={unsubscribe}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md"
          >
            🚫 ปิดการแจ้งเตือน
          </button>
        )}
      </div>

      {/* Layout: ตาราง + การ์ด */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* ตารางข้อมูล */}
        <div className="md:col-span-2 bg-white shadow-md rounded-lg p-4 overflow-y-auto max-h-[350px]">
          <h3 className="font-semibold mb-3">📋 ข้อมูลล่าสุด</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">เวลา</th>
                <th className="p-2 border">อุณหภูมิ (°C)</th>
                <th className="p-2 border">ความชื้น (%)</th>
                <th className="p-2 border">ฝนตก</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((d, i) => (
                <tr key={i} className="text-center border-b">
                  <td className="p-2">{d.timestamp ? new Date(d.timestamp).toLocaleString() : "N/A"}</td>
                  <td>{d.temperature ?? "-"}</td>
                  <td>{d.humidity ?? "-"}</td>
                  <td>{d.rain_detected ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* การ์ดสรุป */}
        <div className="flex flex-col gap-4">
          <div className="bg-blue-100 p-4 rounded-lg shadow text-center">
            <h4 className="font-medium">🌧️ ฝนตกต่อวัน</h4>
            <p className="text-xl font-bold text-blue-600">
              {Object.values(rainByDay).slice(-1)[0] || 0} ครั้ง
            </p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow text-center">
            <h4 className="font-medium">📅 ฝนตกต่อเดือน</h4>
            <p className="text-xl font-bold text-yellow-700">
              {Object.values(rainByMonth).slice(-1)[0] || 0} ครั้ง
            </p>
          </div>
        </div>
      </div>

      {/* กราฟ */}
      <div className="bg-white mt-6 p-4 shadow rounded-lg">
        <h3 className="font-semibold mb-3">📊 กราฟจำนวนครั้งที่ฝนตกต่อวัน</h3>
        <Line data={chartData} />
      </div>

      {/* QR Code */}
      <div className="text-center mt-8">
        <h3 className="font-semibold mb-3">📱 สแกน QR Code เพื่อเปิดบนมือถือ</h3>
        <QRCodeCanvas
          value="https://rain-frontend.onrender.com"
          size={180}
          fgColor="#000"
          bgColor="#fff"
          level="H"
          includeMargin={true}
        />
        <p className="mt-2 text-gray-600">สแกนเพื่อดู Dashboard และเปิดการแจ้งเตือน</p>
      </div>
    </div>
  );
}

export default Dashboard;
