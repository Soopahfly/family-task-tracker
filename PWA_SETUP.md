# PWA Setup Guide

## Why No Install Button (+) Appears

The PWA install prompt requires **all** of these conditions:

### 1. ✅ Valid Manifest File
- Located at `/manifest.json`
- Properly linked in HTML
- Contains required fields

### 2. ❌ **Missing: App Icons**
This is why you're not seeing the install button!

### 3. ✅ Service Worker
- Registered and active
- Serves content offline

### 4. ⚠️ **HTTPS or Localhost Required**
- PWA only works on `https://` or `http://localhost`
- Development server (`localhost:5173`) ✅ Works
- Production must use HTTPS ⚠️

---

## Quick Fix: Generate PWA Icons

### Step 1: Generate Icons

1. **Open the icon generator** in your browser:
   ```
   http://localhost:5175/create-icons.html
   ```

2. **Click "Generate Both Icons"** button

3. **Two PNG files will download:**
   - `icon-192.png`
   - `icon-512.png`

4. **Move downloaded files** to `public/` folder:
   ```
   c:\Users\soopa\family-task-tracker\public\
   ```

### Step 2: Verify Icons Are In Place

```bash
dir c:\Users\soopa\family-task-tracker\public\
```

You should see:
- ✅ icon-192.png
- ✅ icon-512.png
- ✅ manifest.json
- ✅ sw.js

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Restart
cd c:\Users\soopa\family-task-tracker
npm run dev
```

### Step 4: Test PWA Install

1. Open http://localhost:5173
2. Look for **⊕ install** icon in address bar (Chrome/Edge)
3. Or check browser menu for "Install Family Task Tracker"

---

## Testing PWA Install in Different Browsers

### Google Chrome / Microsoft Edge
- **Desktop:** Look for ⊕ icon in address bar (right side)
- **Mobile:** Banner appears at bottom, or "Add to Home Screen" in menu

### Firefox
- **Desktop:** No automatic install prompt (PWA support limited)
- **Mobile:** "Install" option in three-dot menu

### Safari (iOS)
- **No automatic prompt**
- **Manual install:** Share button → "Add to Home Screen"

---

## PWA Requirements Checklist

Use this to debug why PWA isn't installing:

```
☐ Icons exist (icon-192.png, icon-512.png)
☐ Manifest is valid (/manifest.json loads)
☐ Service worker registered (check DevTools → Application)
☐ Using HTTPS or localhost
☐ Visited site at least twice (Chrome requirement)
☐ User engagement (interacted with page)
☐ No errors in console (F12)
```

---

## Testing PWA in Browser DevTools

### Chrome/Edge DevTools

1. Open DevTools (F12)
2. Go to **Application** tab
3. Check **Manifest** section:
   - Should show "Family Task Tracker"
   - Icons should be listed (192x192, 512x512)
   - No errors

4. Check **Service Workers** section:
   - Should show "activated and is running"
   - Status: green dot

5. Click **"Add to Home Screen"** at top to test install

### Example of Working PWA:
```
✅ Manifest: Family Task Tracker
✅ Icons: 2 icons (192x192, 512x512)
✅ Service Worker: activated
✅ Installable: Yes
```

---

## Common Issues & Fixes

### Issue 1: Icons Not Loading

**Symptoms:** Manifest error "Icon could not be loaded"

**Fix:**
```bash
# Verify icons exist
dir public\icon-*.png

# Should see:
# icon-192.png
# icon-512.png
```

If missing, use the icon generator at `/create-icons.html`

### Issue 2: Manifest Not Found

**Symptoms:** 404 error on `/manifest.json`

**Fix:**
```bash
# Check file exists
dir public\manifest.json

# Verify it's being served
# Visit: http://localhost:5173/manifest.json
```

### Issue 3: Service Worker Not Registering

**Symptoms:** Console error "Service worker registration failed"

**Fix:**
```bash
# Check sw.js exists
dir public\sw.js

# Clear browser cache
# DevTools → Application → Storage → Clear site data
```

### Issue 4: Install Prompt Doesn't Appear

**Possible causes:**
- Already installed (check chrome://apps)
- Not enough engagement (click around first)
- Visited less than 2 times
- Using HTTP instead of HTTPS (in production)

**Fix:**
```bash
# Chrome: chrome://flags/#bypass-app-banner-engagement-checks
# Enable to test without engagement requirement
```

---

## Production Deployment (Docker)

### HTTPS is Required!

PWA will NOT work in production without HTTPS. Options:

#### Option 1: Reverse Proxy with Let's Encrypt

```yaml
# docker-compose.yml with nginx-proxy
version: '3.8'
services:
  family-task-tracker:
    image: ghcr.io/soopahfly/family-task-tracker:latest
    environment:
      VIRTUAL_HOST: tasks.yourdomain.com
      LETSENCRYPT_HOST: tasks.yourdomain.com
      LETSENCRYPT_EMAIL: your@email.com
```

#### Option 2: Cloudflare Tunnel (Free HTTPS)

```bash
# Install cloudflared
# Run tunnel
cloudflared tunnel --url http://localhost:3000
```

Gives you: `https://random-name.trycloudflare.com`

#### Option 3: Self-Signed Certificate (Development Only)

```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes

# Update nginx.conf to use SSL
```

---

## Verifying PWA Works

### Desktop Install Test

1. Open app in Chrome/Edge
2. Look for ⊕ icon in address bar
3. Click "Install"
4. App opens in standalone window (no browser UI)
5. Check Start Menu / Applications folder for app icon

### Mobile Install Test

1. Open app on mobile browser
2. Look for "Add to Home Screen" prompt
3. Or: Menu → "Install app" or "Add to Home Screen"
4. Icon appears on home screen
5. Opens in fullscreen (no browser UI)

### Offline Test

1. Install PWA
2. Open DevTools → Network → Check "Offline"
3. Reload page
4. Should still work (thanks to service worker cache)

---

## PWA Features Working After Install

Once installed correctly, you get:

✅ **Standalone Window** - No browser address bar
✅ **Home Screen Icon** - Launch like native app
✅ **Offline Mode** - Works without internet
✅ **Background Sync** - (if implemented)
✅ **Push Notifications** - (if implemented)
✅ **Shortcuts** - Right-click icon for quick actions

---

## Icon Generator Alternative: Online Tools

If the built-in generator doesn't work, use these online tools:

### Option 1: RealFaviconGenerator
https://realfavicongenerator.net/

1. Upload `public/icon.svg`
2. Configure options
3. Download package
4. Extract icons to `public/`

### Option 2: PWA Asset Generator
https://www.pwabuilder.com/imageGenerator

1. Upload source image
2. Select "Generate PWA icons"
3. Download ZIP
4. Extract to `public/`

### Option 3: Favicon.io
https://favicon.io/

1. Create icon (text, emoji, or image)
2. Download
3. Use 192.png and 512.png files

---

## Testing Your PWA Score

### Lighthouse Audit (Chrome DevTools)

1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Select "Progressive Web App"
4. Click "Generate report"

**Target Score: 100/100**

Common issues that reduce score:
- Missing icons ❌
- No service worker ❌
- Not served over HTTPS ❌
- Missing manifest fields ❌

### Expected Results:

```
✅ Installable
✅ PWA Optimized
✅ Service worker registered
✅ Manifest includes app name
✅ Icons provided (192px, 512px)
✅ Theme color set
✅ Content sized correctly for viewport
```

---

## Update Strategy for PWA

### Service Worker Update Flow

1. User opens installed PWA
2. Service worker checks for updates
3. If new version found, downloads in background
4. Shows "Update available" prompt
5. User clicks "Update"
6. New version activates

### Manual Update

```javascript
// In your app, add update button
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.update(); // Force check for updates
  });
}
```

---

## Summary: Making PWA Install Work

### Required Files (in `public/`):

```
public/
├── manifest.json     ✅ Already exists
├── sw.js            ✅ Already exists
├── icon-192.png     ❌ MISSING - Generate this!
└── icon-512.png     ❌ MISSING - Generate this!
```

### Steps to Enable PWA:

1. ✅ Visit http://localhost:5175/create-icons.html
2. ✅ Click "Generate Both Icons"
3. ✅ Move downloads to `public/` folder
4. ✅ Restart dev server
5. ✅ Open app, look for ⊕ icon
6. ✅ Click "Install"

That's it! 🎉
