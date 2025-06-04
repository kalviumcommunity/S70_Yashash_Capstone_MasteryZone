// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCNNyPGmBuV57e0LR0r2zOVdsEBl3bccBU",
  authDomain: "s70-capstonestone-masteryzone.firebaseapp.com",
  projectId: "s70-capstonestone-masteryzone",
  storageBucket: "s70-capstonestone-masteryzone.firebasestorage.app",
  messagingSenderId: "817463451997",
  appId: "1:817463451997:web:2125d5a42272dadec748b4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };


