importScripts('https://www.gstatic.com/firebasejs/4.9.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.9.1/firebase-messaging.js');
/*Update this config*/
var config = {
    apiKey: "AIzaSyDUHLb4tEIDjkBZWCdD9-1bYuOG252pavw",
    authDomain: "notify-project-24acd.firebaseapp.com",
    databaseURL: "https://notify-project-24acd.firebaseio.com",
    projectId: "notify-project-24acd",
    storageBucket: "notify-project-24acd.appspot.com",
    messagingSenderId: "229624951062"
  };
  firebase.initializeApp(config);
const messaging = firebase.messaging();
var url = '';
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.data.title;
  url = payload.data.click_action;
  const notificationOptions = {
    body: payload.data.body,
	icon: payload.data.icon,
	image: payload.data.image,
      data : {
          time: new Date(Date.now()).toString(),
          click_action: payload.data.click_action,
      }
  };

  return self.registration.showNotification(notificationTitle,
      notificationOptions);
});
self.addEventListener('notificationclick', function (event) {
    clients.openWindow(url);
});
