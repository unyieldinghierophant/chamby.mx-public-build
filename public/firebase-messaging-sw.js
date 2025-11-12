importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  messagingSenderId: "66742424691", // <-- replace with YOUR Sender ID
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Chamby";
  const options = {
    body: payload.notification?.body || "Tienes una nueva notificación.",
    icon: "/icons/icon-192x192.png",
  };
  self.registration.showNotification(title, options);
});
