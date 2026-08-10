// ======================================================
// firebase-config.js
// Firebase + Firestore + Authentication
// ======================================================


// ======================================================
// Firebase App
// ======================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";


// ======================================================
// Firestore
// ======================================================

import {

  getFirestore,

  collection,
  addDoc,
  getDocs,
  deleteDoc,

  doc,
  getDoc,

  query,
  where,
  orderBy,
  limit,

  updateDoc,
  setDoc,

  writeBatch,

  serverTimestamp,
  increment,

  onSnapshot

} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


// ======================================================
// Authentication
// ======================================================

import {

  getAuth,

  signInWithEmailAndPassword,

  signOut,

  onAuthStateChanged,

  sendPasswordResetEmail

} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";


// ======================================================
// إعدادات Firebase
// ======================================================

const firebaseConfig = {

  apiKey:
    "AIzaSyD3dTJG6AfeCDZPhsAH7Qzly1jLF57T4T8",

  authDomain:
    "istibana-platform-8bc38.firebaseapp.com",

  projectId:
    "istibana-platform-8bc38",

  storageBucket:
    "istibana-platform-8bc38.firebasestorage.app",

  messagingSenderId:
    "649189396751",

  appId:
    "1:649189396751:web:c87ac19e97cacf35a5ee7a"

};


// ======================================================
// تشغيل Firebase
// ======================================================

const app =
  initializeApp(
    firebaseConfig
  );


// ======================================================
// تشغيل Firestore
// ======================================================

const db =
  getFirestore(
    app
  );


// ======================================================
// تشغيل Authentication
// ======================================================

const auth =
  getAuth(
    app
  );


// ======================================================
// التصدير
// ======================================================

export {

  // Firebase

  app,


  // Firestore

  db,

  collection,
  addDoc,
  getDocs,
  deleteDoc,

  doc,
  getDoc,

  query,
  where,
  orderBy,
  limit,

  updateDoc,
  setDoc,

  writeBatch,

  serverTimestamp,
  increment,

  onSnapshot,


  // Authentication

  auth,

  signInWithEmailAndPassword,

  signOut,

  onAuthStateChanged,

  sendPasswordResetEmail

};