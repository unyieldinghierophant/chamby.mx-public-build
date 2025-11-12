// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAMWqd6KpWaolubCbu-D40cuHWgA4HeTtc",
  authDomain: "chamby-d8e7c.firebaseapp.com",
  projectId: "chamby-d8e7c",
  storageBucket: "chamby-d8e7c.firebasestorage.app",
  messagingSenderId: "66742424691",
  appId: "1:66742424691:web:64626ffb0d2877ba160606",
  measurementId: "G-TCC96LM6FQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
