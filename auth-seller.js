// auth-seller.js
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

/* ========================================================================
   REGISTER SELLER
======================================================================== */
export async function registerSeller(shopName, ownerName, phone, email, address, coordinates, password) {
  try {
    // 1. Validasi format koordinat sebelum menyentuh Firebase
    const coordParts = coordinates.split(",");
    if (coordParts.length !== 2) {
      throw new Error("Format koordinat tidak valid. Masukkan dengan format: latitude, longitude");
    }
    
    const lat = parseFloat(coordParts[0].trim());
    const lng = parseFloat(coordParts[1].trim());

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Koordinat harus berupa angka yang valid.");
    }

    // 2. Buat user di Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 3. Update profile
    await updateProfile(user, { displayName: shopName });

    // 4. Save ke Firestore
    await setDoc(doc(db, "sellers", user.uid), {
      uid: user.uid,
      shopName: shopName,
      ownerName: ownerName,
      phone: phone,
      email: email,
      address: address,
      location: {
        latitude: lat,
        longitude: lng,
        rawString: coordinates
      },
      isOpen: false, // Default toko tutup saat baru daftar
      createdAt: new Date()
    });

    alert("Pendaftaran berhasil!");
    localStorage.setItem("userRole", "seller");
    window.location.href = "seller.html";
    
  } catch (error) {
    console.error("Registrasi Error:", error);
    alert("Gagal Mendaftar: " + error.message);
  }
}

/* ========================================================================
   LOGIN SELLER
======================================================================== */
export async function loginSeller(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    
    // Verifikasi apakah user memang ada di koleksi "sellers"
    const sellerSnap = await getDoc(doc(db, "sellers", credential.user.uid));

    if (!sellerSnap.exists()) {
      await signOut(auth); // Keluar paksa jika bukan data seller
      throw new Error("Akun ini tidak terdaftar sebagai Seller.");
    }

    localStorage.setItem("userRole", "seller");
    window.location.href = "seller.html";
    
  } catch (error) {
    const msg = error.code === "auth/invalid-credential" ? "Email atau password salah." : error.message;
    alert(msg);
  }
}

/* ========================================================================
   LOGOUT & AUTH CHECK
======================================================================== */
export async function logoutSeller() {
  localStorage.removeItem("userRole");
  await signOut(auth);
  window.location.replace("seller-login.html");
}

export function checkSellerAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    const role = localStorage.getItem("userRole");

    // Jika belum login atau role bukan seller
    if (!user || role !== "seller") {
      window.location.href = "seller-login.html";
      return;
    }

    // Cek apakah data user masih ada di Firestore
    const sellerSnap = await getDoc(doc(db, "sellers", user.uid));
    if (!sellerSnap.exists()) {
      localStorage.removeItem("userRole");
      window.location.href = "seller-login.html";
      return;
    }

    // Jika semua valid, kirim data user ke fungsi callback di file utama
    callback(user);
  });
}