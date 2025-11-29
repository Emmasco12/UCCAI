import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAiCMooKcPQiAVGdV3mf38jhc0DinzMyk",
  authDomain: "uccai-deb4f.firebaseapp.com",
  projectId: "uccai-deb4f",
  storageBucket: "uccai-deb4f.firebasestorage.app",
  messagingSenderId: "579483457936",
  appId: "1:579483457936:web:f8313aecbb8ae39a443b15",
  measurementId: "G-4LW4R5C57D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };