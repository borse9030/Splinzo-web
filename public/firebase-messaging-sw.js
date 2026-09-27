/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Parse query params or fallback config if passed
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForSwInitFallback",
  projectId: "splinzo",
  messagingSenderId: "338870104618",
  appId: "1:338870104618:web:123456",
};

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || "Splinzo Alert";
    const body = payload.notification?.body || payload.data?.body || "";
    const icon = payload.notification?.icon || payload.data?.appLogo || "/logo.png";
    const image = payload.notification?.image || payload.data?.imageUrl;

    const notificationOptions = {
      body,
      icon,
      image,
      badge: "/logo.png",
      data: payload.data || {},
      vibrate: [200, 100, 200],
    };

    self.registration.showNotification(title, notificationOptions);
  });
} catch (e) {
  console.warn("[SW] Firebase messaging background init notice:", e);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let targetUrl = "/dashboard";

  if (data.actionType === "group" && data.groupId) {
    targetUrl = `/groups/${data.groupId}`;
  } else if (data.actionType === "expense" && data.groupId) {
    targetUrl = `/groups/${data.groupId}`;
  } else if (data.externalUrl && data.externalUrl.startsWith("http")) {
    targetUrl = data.externalUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
