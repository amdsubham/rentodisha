import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyApunLilBsWG8YvyLL6hNdpWW0oB_JGNl8",
    authDomain: "odicult-c051c.firebaseapp.com",
    databaseURL: "https://odicult-c051c-default-rtdb.firebaseio.com",
    projectId: "odicult-c051c",
    storageBucket: "odicult-c051c.appspot.com",
    messagingSenderId: "264373040060",
    appId: "1:264373040060:web:8d9c8e752ae975257331b9",
    measurementId: "G-YJTXX7D32M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app)

// initializeAuth(app, {
//     persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });
const db = getFirestore()
const storage = getStorage();
const analytics = getAnalytics(app);
export { analytics, app, auth, db, storage }
