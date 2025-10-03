/* service-worker.js */

// ✅ Event: ติดตั้ง Service Worker
self.addEventListener("install", (event) => {
  console.log("📥 Service Worker: Installed");
  self.skipWaiting();
});

// ✅ Event: Activate
self.addEventListener("activate", (event) => {
  console.log("⚡ Service Worker: Activated");
});

// ✅ Event: รับ Push Notification
self.addEventListener("push", (event) => {
  console.log("📩 Push Event:", event);

  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || "🌧 Rain Alert";
  const options = {
    body: data.body || "ฝนกำลังจะตก อย่าลืมพกร่ม!",
    icon: "/icons/icon-192x192.png", // ใส่ icon ไว้ใน public/icons
    badge: "/icons/icon-192x192.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ✅ Event: เมื่อกด Notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("https://rain-frontend.onrender.com") // 👉 เปลี่ยน URL เป็น frontend ของคุณ
  );
});
