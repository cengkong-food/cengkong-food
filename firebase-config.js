import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

/* FIREBASE CONFIG SINKRON: MENGGUNAKAN CENGKONG-FOOD */
const firebaseConfig = {
  apiKey: "AIzaSyBbrr3_EW19Ax0B-WsIjyo7gudSLGaacZ4",
  authDomain: "cengkong-food.firebaseapp.com",
  projectId: "cengkong-food",
  storageBucket: "cengkong-food.firebasestorage.app",
  messagingSenderId: "341642005798",
  appId: "1:341642005798:web:4b002116b46256c7c845e7"
};

export const app = initializeApp(firebaseConfig);