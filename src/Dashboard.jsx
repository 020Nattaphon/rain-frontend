return (
  <div
    style={{
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      background: "#f0fdfd", // พื้นหลังโทนอ่อนฟ้า-เขียว
      color: "#004d40", // ตัวอักษรโทนเขียวเข้ม
      minHeight: "100vh",
    }}
  >
    <h2 style={{ textAlign: "center", color: "#00796b" }}>
      🌦 Rain Monitoring Dashboard
    </h2>

    {/* ปุ่มแจ้งเตือน */}
    <div style={{ textAlign: "center", margin: "20px" }}>
      {!subscribed ? (
        <button
          onClick={subscribe}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(45deg, #4caf50, #26a69a)",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
          }}
        >
          ✅ เปิดการแจ้งเตือน
        </button>
      ) : (
        <button
          onClick={unsubscribe}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(45deg, #00897b, #43a047)",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
          }}
        >
          🚫 ปิดการแจ้งเตือน
        </button>
      )}
    </div>

    {/* ตาราง + การ์ดสรุป */}
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
      {/* ตาราง */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "15px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#00796b" }}>📋 ข้อมูลล่าสุด</h3>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          <table
            border="1"
            cellPadding="5"
            style={{
              borderCollapse: "collapse",
              width: "100%",
              fontSize: "14px",
              border: "1px solid #b2dfdb",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#e0f7fa" }}>
                <th>เวลา</th>
                <th>อุณหภูมิ (°C)</th>
                <th>ความชื้น (%)</th>
                <th>ฝนตก</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((d, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 ? "#f9f9f9" : "#ffffff" }}>
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
            background: "#b2ebf2",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            color: "#004d40",
          }}
        >
          <h4>🌧️ ฝนตกต่อวัน</h4>
          <p style={{ fontSize: "20px", fontWeight: "bold" }}>
            {Object.values(rainCountByDay).slice(-1)[0] || 0} ครั้ง
          </p>
        </div>
        <div
          style={{
            background: "#c8e6c9",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            color: "#1b5e20",
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
      <h3 style={{ color: "#00796b" }}>📊 กราฟจำนวนครั้งที่ฝนตกต่อวัน</h3>
      <Line data={chartData} />
    </div>

    {/* ตารางช่วงเวลา */}
    <div style={{ marginTop: "30px", background: "#ffffff", borderRadius: "10px", padding: "15px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <h3 style={{ color: "#00796b" }}>⏰ สรุปตามช่วงเวลา (07:00–17:00)</h3>
      <table
        border="1"
        cellPadding="5"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          fontSize: "14px",
          border: "1px solid #b2dfdb",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#e0f7fa" }}>
            <th>ช่วงเวลา</th>
            <th>จำนวนฝนตก (ครั้ง)</th>
            <th>อุณหภูมิเฉลี่ย (°C)</th>
            <th>ความชื้นเฉลี่ย (%)</th>
          </tr>
        </thead>
        <tbody>
          {timeSlotSummary.map((slot, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 ? "#f9f9f9" : "#ffffff" }}>
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
      <h3 style={{ color: "#00796b" }}>📱 สแกน QR Code เพื่อเปิดบนมือถือ</h3>
      <QRCodeCanvas
        value="https://rain-frontend.onrender.com"
        size={200}
        fgColor="#004d40"
        bgColor="#e0f2f1"
        level="H"
        includeMargin={true}
      />
      <p>สแกนเพื่อดู Dashboard และเปิดการแจ้งเตือน</p>
    </div>
  </div>
);
