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
let analytics;

// Skip Firebase on localhost to avoid polluting the production database.
// Add ?firebase=1 to the URL to force-enable Firebase locally when needed.
const _isLocalhost = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''
);
const _forceFirebase = new URLSearchParams(window.location.search).get('firebase') === '1';

if (_isLocalhost && !_forceFirebase) {
    console.log('[dev] Firebase disabled on localhost — using localStorage only.');
    console.log('[dev] To enable Firebase locally, add ?firebase=1 to the URL.');
    database = undefined;
    analytics = undefined;
} else {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        analytics = firebase.analytics();
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.warn('Firebase initialization failed, using localStorage fallback:', error);
        database = undefined;
        analytics = undefined;
    }
}

