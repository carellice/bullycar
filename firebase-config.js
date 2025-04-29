// Importa le funzioni necessarie da Firebase
import { initializeApp } from "https://cdnjs.cloudflare.com/ajax/libs/firebase/9.22.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://cdnjs.cloudflare.com/ajax/libs/firebase/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://cdnjs.cloudflare.com/ajax/libs/firebase/9.22.2/firebase-firestore.js";

// Configurazione Firebase (dovrai creare un progetto Firebase e sostituire questi valori)
const firebaseConfig = {
    apiKey: "AIzaSyA3B23stp1lRHrhpBH2u2vNrGGTE0fRaTg",
    authDomain: "bullycar-3b49d.firebaseapp.com",
    projectId: "bullycar-3b49d",
    storageBucket: "bullycar-3b49d.firebasestorage.app",
    messagingSenderId: "875126826672",
    appId: "1:875126826672:web:6663b7acd578886bf6bd75"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Esporta funzioni Firebase per usarle nell'app
export { auth, db, provider, signInWithPopup, onAuthStateChanged, signOut, doc, setDoc, getDoc };