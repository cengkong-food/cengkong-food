/* =========================
   FIREBASE IMPORT
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// KITA IMPORT LANGSUNG APP YANG SUDAH JADI DARI CONFIG
import { app } from "./firebase-config.js";

/* =========================
   INIT FIREBASE
========================= */
const auth = getAuth(app);
const db = getFirestore(app);
/* =========================
   REGISTER SELLER
========================= */

export async function registerSeller(

  shopName,

  email,

  password

){

  try{

    const userCredential =

    await createUserWithEmailAndPassword(

      auth,
      email,
      password
    );

    const user = userCredential.user;

    /* SAVE SELLER DATA */

    await setDoc(

      doc(db,"sellers",user.uid),

      {

        uid:user.uid,

        shopName:shopName,

        email:email,

        createdAt:new Date()

      }

    );

    alert("Register berhasil");

    window.location.href =
    "seller.html";

  }

  catch(error){

    alert(error.message);

  }

}

/* =========================
   LOGIN SELLER
========================= */

export async function loginSeller(

  email,

  password

){

  try{

    await signInWithEmailAndPassword(

      auth,
      email,
      password

    );

    alert("Login berhasil");

    window.location.href =
    "seller.html";

  }

  catch(error){

    alert(error.message);

  }

}

/* =========================
   LOGIN GOOGLE
========================= */

export async function loginGoogle(){

  try{

    const provider =
    new GoogleAuthProvider();

    const result =
    await signInWithPopup(

      auth,
      provider

    );

    const user =
    result.user;


    /* CHECK SELLER */

    const sellerRef =
    doc(db,"sellers",user.uid);

    const sellerSnap =
    await getDoc(sellerRef);

    /* JIKA BELUM ADA */

    if(!sellerSnap.exists()){

      await setDoc(

        sellerRef,

        {

          uid:user.uid,

          shopName:user.displayName,

          email:user.email,

          createdAt:new Date()

        }

      );

    }

    alert("Login Google berhasil");

    localStorage.setItem(
  "userRole",
  "seller"
);

   window.location.replace(
  "seller.html"
);
  }

  catch(error){

    alert(error.message);

  }

}

/* =========================
   LOGOUT
========================= */

export async function logoutSeller(){

  /* HAPUS ROLE */

  localStorage.removeItem(
    "userRole"
  );

  /* LOGOUT FIREBASE */

  await signOut(auth);

  /* PINDAH LOGIN SELLER */

  window.location.replace(
    "seller-login.html"
  );

}

/* =========================
   CHECK LOGIN
========================= */
export function checkSellerAuth(callback){

  onAuthStateChanged(

    auth,

    (user)=>{

      const role =
      localStorage.getItem(
        "userRole"
      );

      /* JIKA BUKAN SELLER */

      if(role !== "seller"){

        window.location.href =
        "seller-login.html";

        return;

      }

      /* JIKA ADA USER */

      if(user){

        callback(user);

      }

      else{

        window.location.href =
        "seller-login.html";

      }

    }

  );

}