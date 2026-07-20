importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ⚠️ এখানে তোমার আসল Firebase config values দাও
firebase.initializeApp({
    apiKey: "AIzaSyC6PJWYr267lZIAzKUO4bZPNT7JAWSQ2Co",
  authDomain: "brain-13e63.firebaseapp.com",
  databaseURL: "https://brain-13e63-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "brain-13e63",
  storageBucket: "brain-13e63.firebasestorage.app",
  messagingSenderId: "501426141706",
  appId: "1:501426141706:web:601608eb70a950ec6c7df3",
  measurementId: "G-DX5P7XCSGM",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: payload.data,
    vibrate: [200, 100, 200],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
