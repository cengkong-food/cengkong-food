// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0HWy6SkIvVpIsl_5bSD_eNcq3vYsJzxw",
  authDomain: "food-delivery-97a5f.firebaseapp.com",
  databaseURL: "https://food-delivery-97a5f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "food-delivery-97a5f",
  storageBucket: "food-delivery-97a5f.firebasestorage.app",
  messagingSenderId: "1071083538977",
  appId: "1:1071083538977:web:51e617513f6fb639cf3160"
};

export const app = initializeApp(firebaseConfig);