// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from "firebase/auth";

const env = (typeof import.meta !== "undefined" && import.meta && import.meta.env) ? import.meta.env : (typeof process !== "undefined" && process.env ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyCNNyPGmBuV57e0LR0r2zOVdsEBl3bccBU",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "s70-capstonestone-masteryzone.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "s70-capstonestone-masteryzone",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "s70-capstonestone-masteryzone.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "817463451997",
  appId: env.VITE_FIREBASE_APP_ID || "1:817463451997:web:2125d5a42272dadec748b4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
if (typeof window !== "undefined") {
  setPersistence(auth, browserSessionPersistence).catch(() => {});
}
const provider = new GoogleAuthProvider();

export { auth, provider };


