import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { QRCodeCanvas } from "qrcode.react";
import { io } from "socket.io-client";

function Dashboard({ initialData }) {
  const [data, setData] = useState(initialData || []);
  const [subscribed, setSubscribed] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE;

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscribed(true);
        }
      });
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/data`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("❌ Fetch error:", err));
  }, [API_BASE]);

  useEffect(() => {
    const socket = io(API_BASE);
    socket.on("rain_alert", (newData) => {
      setData((prev) => [newData, ...prev]);
    });
    return () => socket.disconnect();
  }, [API_BASE]);

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
    return <p className="text-center">⏳ กำลังโหลดข้อมูล...</p>;
  }

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
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.3)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-700">
        🌦 Rain Monitoring Dashboard
      </h2>

      <div className="flex justify-center mb-6">
        {!subscribed ? (
          <button
            onClick={subscribe}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
          >
            ✅ เปิดการแจ้งเตือน
          </button>
        ) : (
          <button
            onClick={unsubscribe}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
          >
            🚫 ปิดการแจ้งเตือน
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ตารางข้อมูล */}
        <div className="md:col-span-2 bg-white rounded-xl shadow p-4 overflow-x-auto">
          <h3 className="font-semibold mb-3">📋 ข้อมูลล่าสุด</h3>
          <table className="table-auto w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">เวลา</th>
                <th className="p-2">อุณหภูมิ (°C)</th>
                <th className="p-2">ความชื้น (%)</th>
                <th className="p-2">ฝนตก</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((d, i) => (
                <tr key={i} className="border-t text-center">
                  <td className="p-2">
                    {d.timestamp
                      ? new Date(d.timestamp).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="p-2">{d.temperature ?? "-"}</td>
                  <td className="p-2">{d.humidity ?? "-"}</td>
                  <td className="p-2">{d.rain_detected ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* การ์ดสรุป */}
        <div className="grid gap-4">
          <div className="bg-blue-100 p-5 rounded-xl shadow text-center">
            <h4 className="font-semibold">🌧️ ฝนตกต่อวัน</h4>
            <p className="text-xl font-bold text-blue-700">
              {Object.values(rainCountByDay).slice(-1)[0] || 0} ครั้ง
            </p>
          </div>
          <div className="bg-orange-100 p-5 rounded-xl shadow text-center">
            <h4 className="font-semibold">📅 ฝนตกต่อเดือน</h4>
            <p className="text-xl font-bold text-orange-700">
              {Object.values(rainCountByMonth).slice(-1)[0] || 0} ครั้ง
            </p>
          </div>
        </div>
      </div>

      {/* กราฟ */}
      <div className="mt-8 bg-white p-5 rounded-xl shadow">
        <h3 className="font-semibold mb-4">📊 กราฟจำนวนครั้งที่ฝนตกต่อวัน</h3>
        <Line data={chartData} />
      </div>

      {/* ตารางช่วงเวลา */}
      <div className="mt-8 bg-white p-5 rounded-xl shadow overflow-x-auto">
        <h3 className="font-semibold mb-4">⏰ สรุปตามช่วงเวลา (07:00–17:00)</h3>
        <table className="table-auto w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ช่วงเวลา</th>
              <th className="p-2">จำนวนฝนตก (ครั้ง)</th>
              <th className="p-2">อุณหภูมิเฉลี่ย (°C)</th>
              <th className="p-2">ความชื้นเฉลี่ย (%)</th>
            </tr>
          </thead>
          <tbody>
            {timeSlotSummary.map((slot, i) => (
              <tr key={i} className="border-t text-center">
                <td className="p-2">{slot.label}</td>
                <td className="p-2">{slot.count}</td>
                <td className="p-2">{slot.avgTemp}</td>
                <td className="p-2">{slot.avgHum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Code */}
      <div className="text-center mt-10">
        <h3 className="font-semibold mb-3">📱 สแกน QR Code เพื่อเปิดบนมือถือ</h3>
        <div className="inline-block bg-white p-4 rounded-xl shadow">
          <QRCodeCanvas
            value="https://rain-frontend.onrender.com"
            size={200}
            fgColor="#000000"
            bgColor="#ffffff"
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="mt-2 text-gray-600">
          สแกนเพื่อดู Dashboard และเปิดการแจ้งเตือน
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
