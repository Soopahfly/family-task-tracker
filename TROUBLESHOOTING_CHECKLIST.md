# Troubleshooting Checklist

## PWA Not Working

### In Development Mode (npm run dev):
PWA features are **limited** in dev mode. This is normal!

**Why:**
- Service workers don't always register in dev mode
- Install prompts may not appear
- Some PWA features need production build

**Solution:**
Test PWA properly with production build:

```bash
# Build production version
npm run build

# Serve it
npx serve -s dist -p 3000

# Or use Docker (recommended)
docker compose build
docker compose up -d
```

Open http://localhost:3000 and you should see:
- ✅ Install button in browser address bar
- ✅ Service worker registered
- ✅ Full PWA functionality

### Verify PWA is Working:

1. **Open DevTools (F12)**
2. Go to **Application** tab
3. Check **Service Workers** section
   - Should show "activated and running"
4. Check **Manifest** section
   - Should show "Kids Task Tracker" details
5. Look for install icon (⊕) in address bar

### Common Issues:

**No install prompt:**
- Must be on localhost or HTTPS
- Must have manifest.json (check http://localhost:3000/manifest.json)
- Must have service worker registered
- Chrome/Edge work best

**Service worker not registering:**
- Check console for errors
- Verify /sw.js exists (check http://localhost:3000/sw.js)
- Try hard refresh (Ctrl+Shift+R)

## Password Protection Not Working

### Check Browser Console:

1. Open app
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Go to Admin → Password Protection
5. Look for RED error messages

### Common Issues:

**Password Protection section not visible:**
- Check if you're in Admin tab
- Scroll down - it's below the module list
- Check console for import errors

**Can't click "Set Up Password" button:**
- Check browser console for errors
- Try refreshing page (F5)
- Check if PasswordSettings.jsx exists

**Password setting fails:**
- Check if crypto.subtle is available (needs HTTPS or localhost)
- Check browser console for specific error
- Try in Chrome/Edge (best crypto API support)

### Test Crypto API:

Open browser console (F12) and paste:

```javascript
// Test if crypto API works
crypto.subtle.digest('SHA-256', new TextEncoder().encode('test'))
  .then(() => console.log('✅ Crypto API works!'))
  .catch(err => console.log('❌ Crypto API failed:', err))
```

If you see "Crypto API works!" → Password system should work
If you see error → You need HTTPS or localhost

### Verify Files Exist:

Check these files exist:
- `src/utils/authManager.js` - Password logic
- `src/components/PasswordSettings.jsx` - Password UI
- `src/components/PasswordLogin.jsx` - Login screen

### Test Password Functions:

Open browser console and test:

```javascript
// Test if authManager is loaded
import('./src/utils/authManager.js').then(module => {
  console.log('✅ Auth manager loaded:', Object.keys(module))
}).catch(err => {
  console.log('❌ Auth manager failed:', err)
})
```

## General Debugging Steps

### 1. Check Dev Server is Running:
```bash
# Should see "ready in XXms"
# Note the port number
```

### 2. Clear Browser Cache:
- Press Ctrl+Shift+R (hard refresh)
- Or: Settings → Clear browsing data → Cached images and files

### 3. Check Browser Console:
- Press F12
- Look for RED error messages
- Share any errors you see

### 4. Verify All Files Imported:

Check if these import without errors:

**In App.jsx:**
```javascript
import PasswordLogin from './components/PasswordLogin'
import { isPasswordSet, verifyPassword, isSessionValid, logoutSession } from './utils/authManager'
```

**In AdminSettings.jsx:**
```javascript
import PasswordSettings from './PasswordSettings'
```

### 5. Test in Different Browser:
- Try Chrome (best support)
- Try Edge
- Avoid Firefox/Safari for initial testing

## Quick Diagnostic Commands

### Check all password-related files exist:
```bash
ls src/utils/authManager.js
ls src/components/PasswordSettings.jsx
ls src/components/PasswordLogin.jsx
```

### Check all PWA files exist:
```bash
ls public/manifest.json
ls public/sw.js
ls index.html
```

### Check for syntax errors:
```bash
npm run build
# If this fails, there are code errors
```

## What to Share for Help

If still having issues, share:

1. **Browser console errors** (F12 → Console → screenshot of red errors)
2. **Which browser** (Chrome, Firefox, Edge, Safari?)
3. **Which mode** (dev server or Docker?)
4. **Specific steps** that reproduce the problem
5. **Expected vs actual behavior**

## Production Deployment (Everything Works!)

The easiest way to test everything:

```bash
# Deploy with Docker
docker compose build
docker compose up -d

# Open http://localhost:3000
```

In Docker/production mode:
- ✅ PWA works perfectly
- ✅ Password protection works
- ✅ Service worker registers
- ✅ Install prompts appear
- ✅ All features enabled

Development mode has limitations - this is normal for React/Vite apps!
