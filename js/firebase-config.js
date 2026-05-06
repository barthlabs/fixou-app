// fixou.app — Firebase Configuration
// Project: fixou-app26 (barthlabs)
// Created: 2026-04-30

// Compat SDK (matches scoreplace.app pattern)
const firebaseConfig = {
  apiKey: "AIzaSyCulsnRRl-8ODAkCfwUp7DMK4xRQm8T5RM",
  authDomain: "fixou-app26.firebaseapp.com",
  projectId: "fixou-app26",
  storageBucket: "fixou-app26.firebasestorage.app",
  messagingSenderId: "627719405618",
  appId: "1:627719405618:web:91e3a2594eb97cf905fc2b",
  measurementId: "G-63KKD3Y0SZ"
};

// Initialize Firebase (compat SDK loaded via <script> in index.html)
firebase.initializeApp(firebaseConfig);

// Expose services globally for vanilla JS modules
window.auth = firebase.auth();
window.db = firebase.firestore();
window.storage = firebase.storage();

// Enable offline persistence for Firestore (best effort)
window.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('[fixou.app] Persistence disabled — multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('[fixou.app] Persistence not supported in this browser');
  }
});

console.log('[fixou.app] Firebase initialized — project:', firebaseConfig.projectId);
