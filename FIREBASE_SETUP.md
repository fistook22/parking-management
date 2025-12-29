# Firebase Setup Guide

Follow these steps to complete the Firebase setup for real-time collaboration.

## Step 1: Enable Realtime Database

1. Go to your Firebase Console: https://console.firebase.google.com/u/0/project/dtparking/overview
2. Click on **"Realtime Database"** in the left sidebar
3. If you haven't created a database yet:
   - Click **"Create Database"**
   - Choose a location (e.g., `us-central1` or closest to you)
   - Select **"Start in test mode"** (for MVP - allows read/write)
   - Click **"Enable"**

## Step 2: Get Your Firebase Config

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. If you don't have a web app yet:
   - Click the **`</>`** (web) icon
   - Register your app (give it a nickname like "Parking App")
   - Click **"Register app"**
5. Copy the `firebaseConfig` object values

## Step 3: Update firebase-config.js

Open `firebase-config.js` and replace these placeholders with your actual values:

- `YOUR_API_KEY_HERE` → Your `apiKey`
- `YOUR_MESSAGING_SENDER_ID` → Your `messagingSenderId`
- `YOUR_APP_ID` → Your `appId`

The `databaseURL` should already be correct (`https://dtparking-default-rtdb.firebaseio.com`), but verify it matches your Realtime Database URL.

**Example:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC...",
    authDomain: "dtparking.firebaseapp.com",
    databaseURL: "https://dtparking-default-rtdb.firebaseio.com",
    projectId: "dtparking",
    storageBucket: "dtparking.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

## Step 4: Set Database Rules (Optional but Recommended)

1. Go to **Realtime Database** → **Rules** tab
2. Replace the rules with:

```json
{
  "rules": {
    "parking": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. Click **"Publish"**

**Note:** For production, you should add authentication and restrict access. The above rules allow anyone to read/write (fine for MVP with trusted team).

## Step 5: Test It!

1. Open `index.html` in your browser
2. Open browser console (F12) - you should see: `Firebase initialized successfully`
3. Click a parking slot - it should toggle
4. Open the same page in another browser/device
5. Changes should appear in real-time on both!

## Troubleshooting

### "Firebase not available, using localStorage only"
- Check that `firebase-config.js` has correct values
- Verify Realtime Database is created and enabled
- Check browser console for errors

### Changes not syncing
- Verify database rules allow read/write
- Check browser console for Firebase errors
- Make sure both devices are online

### Database URL mismatch
- Go to Realtime Database → check the URL at the top
- Update `databaseURL` in `firebase-config.js` to match

## What Happens Now?

✅ **Real-time sync** - All users see changes instantly  
✅ **Shared state** - Everyone sees the same parking status  
✅ **Offline fallback** - Works with localStorage if Firebase is unavailable  
✅ **Daily reset** - Still works automatically  

## Next Steps

Once working, you can:
- Host the app (GitHub Pages, Netlify, Vercel)
- Share the URL via WhatsApp
- Everyone will see real-time updates!

