importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDOSIhWwrlkhNfk8Y3-tl9IebJW0YBA7d4",
  authDomain: "youbiiiz-app.firebaseapp.com",
  projectId: "youbiiiz-app",
  storageBucket: "youbiiiz-app.firebasestorage.app",
  messagingSenderId: "664733497216",
  appId: "1:664733497216:web:ae19fbadf0fa509f59b365"
});

const messaging = firebase.messaging();

// Notification en arriere-plan (app fermee ou onglet cache)
messaging.onBackgroundMessage(function(payload) {
  console.log("Notification en arriere-plan:", payload);
  const title = payload.notification?.title || "Youbiiiz";
  const options = {
    body: payload.notification?.body || "Nouvelle notification",
    icon: "/icon-192.png",
    badge: "/icon-72.png",
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      { action: "open", title: "Voir" },
      { action: "close", title: "Fermer" }
    ]
  };
  self.registration.showNotification(title, options);
});

// Clic sur la notification
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(list) {
        if (list.length > 0) {
          list[0].focus();
          return list[0].navigate("/");
        }
        return clients.openWindow("/");
      })
    );
  }
});

// Installation du service worker
self.addEventListener("install", function(e) {
  self.skipWaiting();
});
self.addEventListener("activate", function(e) {
  e.waitUntil(clients.claim());
});
