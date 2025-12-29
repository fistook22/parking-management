# Parking Management System MVP

A mobile-friendly web app for managing parking slots, shareable via WhatsApp.

## Features

- ✅ **Floor-based organization** - All parking slots organized by floor (1, 2, 4, -1, -2, -3, -4)
- ✅ **Color-coded status**:
  - 🟢 **Green** = Free (clickable)
  - 🔴 **Red** = Occupied (clickable)
  - 🔵 **Blue** = Assigned to individuals (non-clickable)
- ✅ **Mobile-optimized** - Touch-friendly interface for mobile devices
- ✅ **Real-time collaboration** - Firebase-powered, everyone sees updates instantly
- ✅ **Daily auto-reset** - All slots reset to free at midnight
- ✅ **WhatsApp shareable** - Works as a web app, can be shared via link
- ✅ **Offline support** - Uses localStorage fallback when Firebase unavailable

## How to Use

1. **Open the app** - Open `index.html` in a web browser
2. **View parking slots** - See all slots organized by floor
3. **Toggle status** - Tap any free (green) or occupied (red) slot to change its status
4. **Assigned slots** - Blue slots are permanently assigned and cannot be toggled
5. **Reset manually** - Use "Reset All (Today)" button to reset all slots to free
6. **Daily reset** - All slots automatically reset to free at midnight

## Deployment

### Quick Deploy to GitHub Pages

See **[DEPLOY.md](DEPLOY.md)** for step-by-step instructions.

**Quick steps:**
1. Create GitHub repository
2. Push code: `git init && git add . && git commit -m "Initial commit" && git push`
3. Enable GitHub Pages in repository Settings → Pages
4. Share the URL: `https://YOUR_USERNAME.github.io/parking-management/`

### Other Hosting Options

- **Netlify** - Drag & drop folder, instant deploy
- **Vercel** - Connect GitHub repo, auto-deploy
- **Firebase Hosting** - `firebase deploy` (if using Firebase CLI)

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and responsive design
- `app.js` - Application logic and state management
- `manifest.json` - PWA manifest for mobile installation

## Data Structure

The app includes all parking slots from your image:
- **Floor 1**: Slots 40, 41
- **Floor 2**: Slots 1, 3, 5
- **Floor 4**: Slots 45, 46
- **Floor -1**: Slots 92, 93
- **Floor -2**: Slots 29, 30, 31, 308, 350
- **Floor -3**: Slots 47, 48, 49, 335, 338, 339, 336
- **Floor -4**: Slots 19, 243, 238, 240, 241, 242

## Customization

To modify parking slots, edit the `parkingData` object in `app.js`:

```javascript
{
    floor: 1,
    color: 'floor-1',
    slots: [
        { number: 40, name: 'Person Name', assigned: true },
        { number: 41, name: null, assigned: false }
    ]
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Works best on mobile devices

## Notes

- **Real-time sync** - Status synced via Firebase Realtime Database
- **LocalStorage backup** - Falls back to localStorage if Firebase unavailable
- **Daily reset** - Each day gets its own storage key for automatic reset
- **All slots clickable** - Including assigned slots (blue) can be toggled
- **Double parking** - Slots with "כפולה" are split into 2 separate slots

## Setup

1. **Firebase Setup** - See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. **Deployment** - See [DEPLOY.md](DEPLOY.md)

