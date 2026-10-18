import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
//import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyC26jQn5HmMZkrEuL3TTrREuSFFafvSWUo",
  authDomain: "coffee-kaki-app.firebaseapp.com",
  projectId: "coffee-kaki-app",
  storageBucket: "coffee-kaki-app.firebasestorage.app",
  messagingSenderId: "355933020662",
  appId: "1:355933020662:web:376d73a31295cf5080a7d7",
  measurementId: "G-77DSNZHDC6"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configure Google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

//export const analytics = getAnalytics(app);
