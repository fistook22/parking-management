// Firebase configuration
// Get these values from: https://console.firebase.google.com/u/0/project/dtparking/settings/general
// 
// Steps to get your config:
// 1. Go to Firebase Console → Project Settings (gear icon)
// 2. Scroll down to "Your apps" section
// 3. If no web app exists, click "</>" to add one
// 4. Copy the config values below

const firebaseConfig = {
    apiKey: "AIzaSyC00mFm9T4_yId1Z5e7uNgJFuB7thEBLJM",
    authDomain: "dtparking.firebaseapp.com",
    databaseURL: "https://dtparking-default-rtdb.firebaseio.com", // or your region-specific URL
    projectId: "dtparking",
    storageBucket: "dtparking.appspot.com",
    messagingSenderId: "1055764806276",
    appId: "1:1055764806276:web:3449148b16cae01e2060d1"
};

// Initialize Firebase
let database;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.warn('Firebase initialization failed, using localStorage fallback:', error);
    database = undefined;
}

