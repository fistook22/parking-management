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
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    analytics = firebase.analytics();
    console.log('Firebase initialized successfully');
    console.log('Analytics initialized');
    
    // Enable DebugView for localhost testing
    // This allows you to see events in real-time in Firebase Console
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // For web, DebugView is enabled via URL parameter or browser extension
        // We'll log events to console for immediate feedback
        console.log('🔍 Debug mode: Events will be logged to console');
        console.log('📊 To see events in Firebase Console DebugView:');
        console.log('   1. Open Firebase Console → Analytics → DebugView');
        console.log('   2. Or install "Firebase Analytics Debugger" Chrome extension');
    }
} catch (error) {
    console.warn('Firebase initialization failed, using localStorage fallback:', error);
    database = undefined;
    analytics = undefined;
}

