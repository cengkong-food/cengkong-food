import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from "./firebase-config.js";

const db = getFirestore(app);

// fungsi jarak (haversine)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// 🔥 MAIN FUNCTION CREATE ORDER + AUTO ASSIGN
window.createOrder = async function(orderData, orderLat, orderLng) {

  // 1. buat order dulu
  const orderRef = await addDoc(collection(db, "orders"), {
    ...orderData,
    status: "READY",
    driverId: null,
    createdAt: new Date()
  });

  // 2. cari driver online
  const q = query(collection(db, "drivers"), where("isOnline", "==", true));
  const snap = await getDocs(q);

  let nearestDriver = null;
  let minDist = 999999;

  snap.forEach(d => {
    const data = d.data();

    if (!data.location) return;

    const dist = getDistance(
      orderLat, orderLng,
      data.location.latitude,
      data.location.longitude
    );

    if (dist < minDist) {
      minDist = dist;
      nearestDriver = d.id;
    }
  });

  // 3. lock driver
  if (nearestDriver) {
    await updateDoc(doc(db, "orders", orderRef.id), {
      driverId: nearestDriver,
      status: "READY_FOR_PICKUP",
      lockedAt: new Date()
    });
  }

  return orderRef.id;
};