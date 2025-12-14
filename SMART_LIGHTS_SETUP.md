# Smart Light Integration Guide

This guide shows you how to integrate Home Assistant or WLED lights with the Kids Task Tracker to create a visual "traffic light" system that shows each kid's task status!

## How It Works

Each kid gets their own light that changes color based on their task completion:

- **🟢 GREEN** = All tasks complete! Great job!
- **🟡 YELLOW** = 1-2 tasks remaining
- **🔴 RED** = 3 or more tasks pending

The lights automatically update when:
- Tasks are marked complete or incomplete
- New tasks are added
- Tasks are deleted

## What You Need

### Option 1: Home Assistant
- Home Assistant installed and running on your network
- A light that supports RGB colors (Philips Hue, WLED, etc.) connected to HA
- A long-lived access token from Home Assistant

### Option 2: WLED (Direct)
- An ESP8266 or ESP32 with WLED firmware
- LED strip connected to the board
- WLED accessible on your network

## Quick Setup Instructions

### Home Assistant Setup

1. **Create a Long-Lived Access Token**:
   - Open Home Assistant
   - Click your profile (bottom left)
   - Scroll to "Long-Lived Access Tokens"
   - Click "Create Token"
   - Give it a name like "Kids Task Tracker"
   - Copy the token (you won't see it again!)

2. **Find Your Light Entity ID**:
   - Go to Developer Tools → States
   - Search for your light (e.g., `light.kids_bedroom`)
   - Copy the entity ID

3. **Configure in the App**:
   - Go to "Smart Lights" tab
   - Click "Add Light Integration"
   - Select "Home Assistant"
   - Enter your HA URL (e.g., `http://192.168.1.100:8123`)
   - Paste your access token
   - Enter the light entity ID
   - Assign to a kid
   - Click "Test" to verify connection
   - Save!

### WLED Setup

1. **Find Your WLED IP Address**:
   - Open the WLED web interface
   - Note the IP address (e.g., `http://192.168.1.101`)
   - Or use mDNS name (e.g., `http://wled-kids.local`)

2. **Configure in the App**:
   - Go to "Smart Lights" tab
   - Click "Add Light Integration"
   - Select "WLED"
   - Enter your WLED URL
   - (Optional) Set segment number if using multiple LED zones
   - Assign to a kid
   - Click "Test" to verify connection
   - Save!

## Manual Integration Code

If you want to manually control the lights from other scripts or automations, here's how:

### Home Assistant Example

```bash
# Update light to GREEN (all tasks done)
curl -X POST \
  http://YOUR-HA-IP:8123/api/services/light/turn_on \
  -H "Authorization: Bearer YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kids_room", "rgb_color": [0, 255, 0], "brightness": 255}'

# Update light to YELLOW (1-2 tasks left)
curl -X POST \
  http://YOUR-HA-IP:8123/api/services/light/turn_on \
  -H "Authorization: Bearer YOUR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kids_room", "rgb_color": [255, 255, 0], "brightness": 255}'

# Update light to RED (3+ tasks pending)
curl -X POST \
  http://YOUR-HA-IP:8123/api/services/light/turn_on \
  -H "Authorization: Bearer YOUR-TOKEN" \
  -H "Content-Type": application/json" \
  -d '{"entity_id": "light.kids_room", "rgb_color": [255, 0, 0], "brightness": 255}'
```

### WLED Example

```bash
# Update WLED to GREEN
curl -X POST \
  http://YOUR-WLED-IP/json/state \
  -H "Content-Type: application/json" \
  -d '{"on":true,"bri":255,"seg":[{"id":0,"col":[[0,255,0]]}]}'

# Update WLED to YELLOW
curl -X POST \
  http://YOUR-WLED-IP/json/state \
  -H "Content-Type: application/json" \
  -d '{"on":true,"bri":255,"seg":[{"id":0,"col":[[255,255,0]]}]}'

# Update WLED to RED
curl -X POST \
  http://YOUR-WLED-IP/json/state \
  -H "Content-Type: application/json" \
  -d '{"on":true,"bri":255,"seg":[{"id":0,"col":[[255,0,0]]}]}'
```

## Troubleshooting

### Connection Failed

**Home Assistant:**
- Make sure Home Assistant is accessible from your computer
- Verify the URL is correct (include http:// and port :8123)
- Check that your access token is valid
- Ensure the light entity ID exists and is spelled correctly

**WLED:**
- Make sure WLED device is powered on and connected to WiFi
- Verify you can access the WLED web interface from a browser
- Check the URL format (should be http://IP-ADDRESS without /json or other paths)

### Lights Not Updating

- Check that the integration is enabled (not disabled)
- Try clicking "Sync All Lights Now" button
- Check browser console for error messages (F12 → Console tab)
- Verify your firewall isn't blocking the requests

### CORS Errors (Browser Blocking Requests)

If you see CORS errors in the console:

**For WLED:**
- This is normal for local network requests
- Solution: Use the browser extension "CORS Unblock" or similar
- Or: Access the app from the same device running WLED

**For Home Assistant:**
- Add your app's URL to trusted networks in HA configuration
- Edit `configuration.yaml`:
  ```yaml
  http:
    cors_allowed_origins:
      - http://localhost:5173
      - http://YOUR-COMPUTER-IP:5173
  ```
- Restart Home Assistant

## Advanced: Multiple Kids, Multiple Lights

You can create separate light integrations for each kid:

1. Kid 1 → Bedroom desk lamp (WLED strip)
2. Kid 2 → Bedside lamp (Home Assistant Hue bulb)
3. Kid 3 → Door frame LED strip (WLED, segment 0)

Each light will independently show that kid's task status!

## Advanced: Custom Colors

Want to customize the traffic light colors? Edit `src/integrations.js`:

```javascript
export function getColorFromStatus(status) {
  const colors = {
    green: { r: 0, g: 255, b: 0 },      // Change these RGB values
    yellow: { r: 255, g: 255, b: 0 },   // to customize colors
    red: { r: 255, g: 0, b: 0 }
  }
  return colors[status] || colors.red
}
```

## Advanced: Custom Task Thresholds

Want to change when lights turn yellow vs red? Edit `src/integrations.js`:

```javascript
export function calculateTrafficLightStatus(kid, tasks) {
  const kidTasks = tasks.filter(t => t.kidId === kid.id && !t.completed)

  if (kidTasks.length === 0) {
    return 'green'
  } else if (kidTasks.length <= 2) {  // Change this number
    return 'yellow'
  } else {
    return 'red'
  }
}
```

## Hardware Recommendations

### Budget Option: WLED with ESP8266
- **Cost**: ~$10-15
- **Parts**: ESP8266 board (like D1 Mini) + WS2812B LED strip
- **Setup**: Flash WLED firmware, connect LED strip, power on
- **Pros**: Cheap, easy, no cloud dependency
- **Cons**: Requires some DIY assembly

### Premium Option: Philips Hue via Home Assistant
- **Cost**: $20-50 per bulb
- **Setup**: Add to Home Assistant, note entity ID
- **Pros**: No DIY, works out of box, professional look
- **Cons**: More expensive, requires Home Assistant

### Best Value: WLED with ESP32 + Diffused Tube
- **Cost**: ~$20-25
- **Parts**: ESP32 board + WS2812B strip + LED diffuser tube/channel
- **Setup**: Flash WLED, insert strip in diffuser, mount in kid's room
- **Pros**: Great diffused effect, WiFi stable, looks professional
- **Cons**: Slight assembly required

## Example Setups

### Setup 1: Desk Lamps
Each kid has a small USB-powered LED strip under their desk that shows their status.

### Setup 2: Door Frame
Install LED strips around each kid's doorway - when walking by, parents can see status at a glance!

### Setup 3: Bedside Night Lights
Use Hue bulbs in bedside lamps that double as task status indicators.

### Setup 4: Reward Display
Set up a large LED matrix or strip in a common area showing all kids' statuses side-by-side.

## Security Notes

- Access tokens are stored in browser localStorage (not server)
- Tokens never leave your local network
- For extra security, use Home Assistant's IP allowlist feature
- Consider creating a separate HA user with limited permissions just for this app

## Need Help?

Common issues and solutions are in the README.md troubleshooting section!
