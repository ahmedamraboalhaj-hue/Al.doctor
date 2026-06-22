// ============================================================
// إعدادات Firebase الخاصة بمنصة الدكتور في اللغة العربية
// يستخدم Compat SDK لأن dashboard.html بيحمّل:
//   firebase-app-compat.js + firebase-firestore-compat.js
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyB6qAG7BUbcaOlsUAeLFhNlnagaHy-XEFc",
  authDomain: "aldoctor-7e153.firebaseapp.com",
  projectId: "aldoctor-7e153",
  storageBucket: "aldoctor-7e153.firebasestorage.app",
  messagingSenderId: "532244052896",
  appId: "1:532244052896:web:84f83cdd097ee81d6982c5",
  measurementId: "G-GLXD2SLFQR"
};

// تهيئة Firebase (Compat API)
firebase.initializeApp(firebaseConfig);

// قاعدة بيانات Firestore - متاحة عالمياً كـ window.db
// (الداشبورد بيستخدم window.db.collection(...) في كل مكان)
window.db = firebase.firestore();
