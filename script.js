/* =========================
   FIREBASE IMPORT (SUDAH DIPERBAIKI + ADD ADD_DOC)
========================= */
import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
   FIREBASE CONFIG
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyA0HWy6SkIvVpIsl_5bSD_eNcq3vYsJzxw",
  authDomain: "food-delivery-97a5f.firebaseapp.com",
  databaseURL: "https://food-delivery-97a5f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "food-delivery-97a5f",
  storageBucket: "food-delivery-97a5f.firebasestorage.app",
  messagingSenderId: "1071083538977",
  appId: "1:1071083538977:web:51e617513f6fb639cf3160"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* =========================
   STORE LOCATION
========================= */
const STORE_LAT = -6.365752;
const STORE_LNG = 107.395501;

let shippingCost = 0;
let userLat = null;
let userLng = null;

let map;
let routeLine;

let cart = [];
let currentMenu = null;
let menuData = {};

/* =========================
   LOGIN CHECK
========================= */
function isLoggedIn(){
  return !!localStorage.getItem("cengkongUser");
}

/* =========================
   LOAD MENU FIREBASE
========================= */
const menuContainer = document.getElementById("menuContainer");

onSnapshot(collection(db, "menus"), async (snapshot) => {
  if (!menuContainer) return;

  menuData = {};

  const menuPromises = snapshot.docs.map(async (menuDoc) => {
    const id = menuDoc.id;
    const data = menuDoc.data();
    menuData[id] = data; 

    let labelStatus = `<span class="badge-status tutup">TUTUP</span>`;
    let namaLapak = "Lapak Pedagang";

    try {
      if (data && data.sellerId) {
        const sellerRef = doc(db, "sellers", data.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();

          data.sellerName =
            sellerData.shopName ||
            sellerData.name ||
            "Lapak Pedagang";

          data.sellerAddress =
            sellerData.sellerAddress || "";

          data.sellerPhone =
            sellerData.whatsap || "";
            namaLapak = sellerData.shopName ||  
            sellerData.name || 
            "Lapak Pedagang";

          if (sellerData.isOpen === true) {
            labelStatus = `<span class="badge-status buka">BUKA</span>`;
          }
        }
      }
    } catch (err) {
      console.log("Gagal memuat data toko untuk menu:", data.title, err);
    }

    const hargaMenu = data.price ? data.price.toLocaleString('id-ID') : "0";

    return `
      <div class="food-card-mobile">
        <img src="${data.image || 'placeholder.png'}" class="food-mobile-img" onerror="this.src='placeholder.png'">
        <div class="food-mobile-info">
          ${labelStatus}
          <h3>${data.title}</h3>
          <p class="lapak-info">Lapak: <strong>${namaLapak}</strong></p>
          <p class="food-desc">Cepat saji</p>
          <div class="food-meta">
            ⭐ 4.8 <span>•</span> Rp ${hargaMenu}
          </div>
          <button class="food-order-btn" onclick="openMenuModal('${id}')">
            Pesan
          </button>
        </div>
      </div>
    `;
  });

  const allMenuHtmls = await Promise.all(menuPromises);
  menuContainer.innerHTML = allMenuHtmls.join("");
});

/* =========================
   OPEN MENU MODAL
========================= */
window.openMenuModal = function(menuKey){
  if(!isLoggedIn()){
    alert("Silakan daftar / login terlebih dahulu");
    window.location.href = "register.html";
    return;
  }

  currentMenu = menuData[menuKey];

  document.getElementById("menuImage").src = currentMenu.image || 'placeholder.png';
  document.getElementById("menuTitle").innerHTML = currentMenu.title;

  const variantList = document.getElementById("variantList");
  variantList.innerHTML = "";

  if(currentMenu.variants && Array.isArray(currentMenu.variants)){
    currentMenu.variants.forEach((variant, index) => {
      const currentItem = cart.find(item => item.name === variant.name);
      const qty = currentItem ? currentItem.qty : 0;

      variantList.innerHTML += `
        <div class="variant-item">
          <div>
            <h4>${variant.name}</h4>
            <p>Rp ${variant.price ? variant.price.toLocaleString('id-ID') : "0"}</p>
          </div>
          <div class="qty-control">
            <button onclick="changeQty(${index}, -1)">-</button>
            <span id="qty-${index}">${qty}</span>
            <button onclick="changeQty(${index}, 1)">+</button>
          </div>
        </div>
      `;
    });
  }

  document.getElementById("menuModal").style.display = "flex";
}

/* =========================
   CLOSE MENU
========================= */
window.closeMenuModal = function(){
  document.getElementById("menuModal").style.display = "none";
}

/* =========================
   CHANGE QTY
========================= */
window.changeQty = function(index, change){
  const variant = currentMenu.variants[index];
  const itemIndex = cart.findIndex(item => item.name === variant.name);

  if(itemIndex !== -1){
    cart[itemIndex].qty += change;
    if(cart[itemIndex].qty <= 0){
      cart.splice(itemIndex, 1);
    }
  } else if(change > 0){
    cart.push({
      name: variant.name,
      price: variant.price,
      qty: 1,
      image: currentMenu.image,
      menuTitle: currentMenu.title,
      sellerName: currentMenu.sellerName || "Pasar Cengkong" 
    });
  }
  updateCart();

  const currentItem = cart.find(item => item.name === variant.name);
  document.getElementById(`qty-${index}`).innerHTML = currentItem ? currentItem.qty : 0;
}

/* =========================
   CONFIRM ORDER
========================= */
window.confirmOrder = function(){
  closeMenuModal();
  showToast();
  updateCart();
}

/* =========================
   UPDATE CART
========================= */
function updateCart(){
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  const stickyTotal = document.getElementById("stickyTotal");
  const stickyCount = document.getElementById("stickyCount");
  const grandTotal = document.getElementById("grandTotal");
  const finalShipping = document.getElementById("finalShipping");

  if(!cartItems) return;

  cartItems.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((item, index) => {
    total += item.price * item.qty;
    count += item.qty;

    cartItems.innerHTML += `
      <div class="cart-modern-item">
        <img src="${item.image || 'placeholder.png'}" class="cart-modern-img">
        <div class="cart-modern-info">
          <h4>${item.name}</h4>
          <p>Rp ${item.price.toLocaleString('id-ID')}</p>
        </div>
        <div class="cart-modern-action">
          <div class="qty-control">
            <button onclick="cartQty(${index}, -1)">-</button>
            <span>${item.qty}</span>
            <button onclick="cartQty(${index}, 1)">+</button>
          </div>
          <h5>Rp ${(item.price * item.qty).toLocaleString('id-ID')}</h5>
        </div>
      </div>
    `;
  });

  if(cartCount) cartCount.innerHTML = count;
  if(cartTotal) cartTotal.innerHTML = total.toLocaleString('id-ID');
  if(stickyTotal) stickyTotal.innerHTML = total.toLocaleString('id-ID');
  if(stickyCount) stickyCount.innerHTML = `${count} item`;
  if(finalShipping) finalShipping.innerHTML = shippingCost.toLocaleString('id-ID');
  if(grandTotal) grandTotal.innerHTML = (total + shippingCost).toLocaleString('id-ID');
}

/* =========================
   CART QTY
========================= */
window.cartQty = function(index, change){
  cart[index].qty += change;
  if(cart[index].qty <= 0){
    cart.splice(index, 1);
  }
  updateCart();
}

/* =========================
   OPEN CART
========================= */
window.openCart = function(){
  if(!isLoggedIn()){
    alert("Silakan daftar / login terlebih dahulu");
    window.location.href = "register.html";
    return;
  }
  document.getElementById("cartModal").style.display = "flex";
  updateCart();
}

/* =========================
   CLOSE CART
========================= */
window.closeCart = function(){
  document.getElementById("cartModal").style.display = "none";
}

/* =========================
   CANCEL ORDER
========================= */
window.cancelOrder = function(){
  cart = [];
  shippingCost = 0;
  updateCart();
  closeCart();
}

/* =========================
   GET USER LOCATION
========================= */
window.getUserLocation = function(){
  if(!navigator.geolocation){
    alert("Geolocation tidak didukung");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const uLat = position.coords.latitude;
      const uLng = position.coords.longitude;
      initMap(uLat, uLng);
    },
    error => {
      alert("Gagal mengambil lokasi");
    }
  );
}

/* =========================
   INIT MAP
========================= */
function initMap(lat, lng){
  userLat = lat;
  userLng = lng;

  if(map){
    map.remove();
  }

  map = L.map('deliveryMap').setView([lat, lng], 15);

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: 'OpenStreetMap' }
  ).addTo(map);

  L.marker([STORE_LAT, STORE_LNG]).addTo(map).bindPopup("🍔 Cengkong Food");
  L.marker([lat, lng]).addTo(map).bindPopup("📍 Lokasi Anda");

  /* =========================
      ROUTE JALAN ASLI
  ========================= */
  fetch(`https://router.project-osrm.org/route/v1/driving/${STORE_LNG},${STORE_LAT};${lng},${lat}?overview=full&geometries=geojson`)
  .then(res => res.json())
  .then(data => {
    if(data.routes && data.routes.length > 0){
      const route = data.routes[0].geometry.coordinates;
      const routeCoords = route.map(point => [point[1], point[0]]);

      routeLine = L.polyline(routeCoords, {
        color: '#2563eb',
        weight: 6
      }).addTo(map);

      map.fitBounds(routeLine.getBounds());
    }
  });

  const distance = map.distance([STORE_LAT, STORE_LNG], [lat, lng]) / 1000;
  document.getElementById("distanceText").innerHTML = distance.toFixed(2) + " km";

  let ongkir = 5000;
  if(distance > 1){
    const extra = Math.ceil((distance - 1) / 0.25);
    ongkir += extra * 1000;
  }

  shippingCost = ongkir;
  document.getElementById("shippingText").innerHTML = ongkir.toLocaleString('id-ID');
  updateCart();
}

/* =========================
   KONEKSI KE DATABASE DRIVER + TRIGGER PELACAKAN NYATA
========================= */
const btnBayarDinamis = document.getElementById("btnBayarDinamis");

if (btnBayarDinamis) {
  btnBayarDinamis.addEventListener("click", async () => {

    const user = auth.currentUser;

    // 1. VALIDASI LOGIN
    if (!user) {
      alert("Anda harus login terlebih dahulu sebelum memesan makanan!");
      window.location.href = "register.html";
      return;
    }

    // 2. VALIDASI CART
    if (cart.length === 0) {
      alert("Keranjang belanja Anda masih kosong!");
      return;
    }

    // 3. VALIDASI LOKASI
    if (!userLat || !userLng) {
      alert("Silakan klik 'Gunakan Lokasi Saya' terlebih dahulu agar Kurir tahu arah rute!");
      return;
    }

    btnBayarDinamis.disabled = true;
    btnBayarDinamis.innerText = "Mencari Driver...";

    try {

    // 4. HITUNG TOTAL
    let subtotalValue = 0;

    cart.forEach(item => {
      subtotalValue += item.price * item.qty;
    });

    const grandTotalValue = subtotalValue + shippingCost;
const orderData = {
customerId: user.uid,
customerName: user.displayName || "Pelanggan",

sellerId: currentMenu?.sellerId || null,

shopName: currentMenu?.sellerName || "Pasar Cengkong",
sellerAddress:
  currentMenu?.sellerAddress || "",

sellerPhone:
  currentMenu?.sellerPhone || "",
menuTitle: currentMenu?.title || "",

items: cart,
itemsName: cart.map(i => i.name).join(", "),

  subtotal: subtotalValue,
  ongkir: shippingCost,
  grandTotal: grandTotalValue,

  customerLatitude: userLat,
  customerLongitude: userLng,

  customerLocation: {
  latitude: userLat,
  longitude: userLng
},


  status: "PENDING",
  createdAt: new Date()
};

await addDoc(
  collection(db, "orders"),
  orderData
);


      // 6. RESET UI
      cart = [];
      shippingCost = 0;
      updateCart();
      closeCart();

      alert("Pesanan berhasil dibuat! Mencari driver... 🚗");

      window.location.href = "orders.html";

    } catch (error) {
      console.error("Gagal membuat pesanan:", error);

      alert("Terjadi masalah jaringan, coba lagi.");

      btnBayarDinamis.disabled = false;
      btnBayarDinamis.innerText = "Pesan & Cari Driver";
    }
  });
}
/* =========================
   TOAST
========================= */
function showToast(){
  const toast = document.getElementById("toast");
  if(!toast) return;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

/* =========================
   DARK MODE & LIVE SEARCH
========================= */
const darkToggle = document.getElementById("darkToggle");
if(darkToggle){
  darkToggle.onclick = function(){
    document.body.classList.toggle("dark");
  }
}

const searchInput = document.getElementById("searchInput");
if(searchInput){
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll(".food-card-mobile");

    cards.forEach(card => {
      const titleElement = card.querySelector("h3");
      if(titleElement){
        const title = titleElement.innerText.toLowerCase();
        if(title.includes(keyword)){
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      }
    });
  });
}

const filterBtn = document.querySelector(".filter-btn");
if(filterBtn){
  filterBtn.addEventListener("click", () => {
    const sInput = document.getElementById("searchInput");
    if(sInput) sInput.focus();
  });
}

/* =========================
   USER LOGIN DISPLAY
========================= */
window.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("cengkongUser");
  const loginBtn = document.getElementById("loginBtn");
  const userBox = document.getElementById("userBox");
  const profileInitial = document.getElementById("profileInitial");
  const profileName = document.getElementById("profileName");

  if(!savedUser) return;

  try {
    const user = JSON.parse(savedUser);
    const nama = user.name || "User";
    const hurufAwal = nama.charAt(0).toUpperCase();

    if(loginBtn) loginBtn.style.display = "none";
    if(userBox) userBox.style.display = "flex";
    if(profileInitial) profileInitial.innerText = hurufAwal;
    if(profileName) profileName.innerText = nama;
  } catch(err) {
    console.log(err);
  }
});

/* =========================
   CEK USER LOGIN STATS (FIREBASE AUTH)
========================= */
onAuthStateChanged(auth, (user) => {
  const profileInitial = document.getElementById("profileInitial");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const loginText = document.getElementById("loginText");

  if(user){
    console.log("USER LOGIN:", user.email);
    localStorage.setItem(
      "cengkongUser",
      JSON.stringify({
        name: user.displayName || user.email.split("@")[0],
        email: user.email
      })
    );

    let name = user.displayName || user.email.split("@")[0];
    if(profileInitial) profileInitial.style.display = "flex";

    const initial = name.charAt(0).toUpperCase();

    if(profileInitial) profileInitial.innerText = initial;
    if(profileName) profileName.innerText = name;
    if(profileEmail) profileEmail.innerText = user.email;
    if(loginText) loginText.innerText = initial;

  } else {
    if(profileInitial) profileInitial.style.display = "none";
    if(profileName){
      profileName.innerHTML = `
        <button onclick="window.location.href='register.html'" class="login-btn-modern">
          <i class="fa-solid fa-right-to-bracket"></i>
          <span>Masuk</span>
        </button>
      `;
    }
  }
});

/* =========================
   LOGOUT ACTION
========================= */
window.logout = function(){
  const yakin = confirm("Yakin ingin keluar?");
  if(!yakin) return;

  signOut(auth)
  .then(() => {
    localStorage.removeItem("cengkongUser");
    alert("Berhasil keluar");
    window.location.href = "index.html";
  })
  .catch((error) => {
    console.log(error);
    alert("Logout gagal");
  });
}