return (
  <div
    style={{
      padding: "30px",
      fontFamily: "Segoe UI, sans-serif",
      background: "#FFF6E3", // พื้นหลังครีมอ่อน
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
            background: "linear-gradient(45deg, #BFECFF, #CDC1FF)",
            color: "#333",
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
            background: "linear-gradient(45deg, #FFCCEA, #CDC1FF)",
            color: "#333",
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
          background: "#BFECFF",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h4 style={{ margin: 0, color: "#333" }}>🌧️ ฝนตกต่อวัน</h4>
        <p style={{ fontSize: "28px", fontWeight: "bold", marginTop: "10px" }}>
          {Object.values(rainCountByDay).slice(-1)[0] || 0} ครั้ง
        </p>
      </div>
      <div
        style={{
          background: "#CDC1FF",
          padding: "25px",
          borderRadius: "15px",
          textAlign: "center",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h4 style={{ margin: 0, color: "#333" }}>📅 ฝนตกต่อเดือน</h4>
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
      <h3 style={{ color: "#333", marginTop: 0 }}>📋 ข้อมูลล่าสุด</h3>
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#FFCCEA", color: "#333" }}>
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
      <h3 style={{ color: "#333", marginTop: 0 }}>📊 กราฟฝนตกต่อวัน</h3>
      <Line
        data={{
          labels: Object.keys(rainCountByDay),
          datasets: [
            {
              label: "จำนวนครั้งที่ฝนตกต่อวัน",
              data: Object.values(rainCountByDay),
              borderColor: "#FF69B4", // เส้นชมพูสดใส
              backgroundColor: "rgba(255, 204, 234, 0.4)", // พื้นชมพูอ่อน
              tension: 0.3,
            },
          ],
        }}
      />
    </div>

    {/* QR Code */}
    <div style={{ textAlign: "center" }}>
      <h3 style={{ color: "#333" }}>📱 เปิด Dashboard บนมือถือ</h3>
      <QRCodeCanvas
        value="https://rain-frontend.onrender.com"
        size={180}
        fgColor="#333"
        bgColor="#BFECFF"
        level="H"
        includeMargin={true}
      />
      <p style={{ fontSize: "13px", color: "#555" }}>
        สแกนเพื่อดู Dashboard และเปิดการแจ้งเตือน
      </p>
    </div>
  </div>
);
