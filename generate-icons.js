// Simple icon generator using canvas for PWA icons
// This creates PNG files from base64 encoded images

const fs = require('fs');
const path = require('path');

// Create a simple colored square as icon data (purple gradient with white checkmark)
// This is a minimal viable PWA icon

function createIcon(size) {
  // Create a minimal HTML file that will render our icon
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas" width="${size}" height="${size}"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, ${size}, ${size});
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ${size}, ${size});

    // White circle (checkmark background)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(${size * 0.5}, ${size * 0.4}, ${size * 0.2}, 0, Math.PI * 2);
    ctx.fill();

    // Checkmark
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = ${size * 0.04};
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(${size * 0.42}, ${size * 0.4});
    ctx.lineTo(${size * 0.48}, ${size * 0.46});
    ctx.lineTo(${size * 0.58}, ${size * 0.34});
    ctx.stroke();

    // Star (gold)
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(${size * 0.75}, ${size * 0.7}, ${size * 0.1}, 0, Math.PI * 2);
    ctx.fill();

    // Star inner
    ctx.fillStyle = 'white';
    const starSize = ${size * 0.08};
    const centerX = ${size * 0.75};
    const centerY = ${size * 0.7};
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * starSize;
      const y = centerY + Math.sin(angle) * starSize;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Save as PNG
    console.log(canvas.toDataURL('image/png'));
  </script>
</body>
</html>
  `;

  return html;
}

console.log('PWA icons need to be created using an image editor or online tool.');
console.log('');
console.log('Quick solution: Use this online tool to generate icons from SVG:');
console.log('https://realfavicongenerator.net/');
console.log('');
console.log('Or use this simple placeholder approach below...');
console.log('');

// For now, create a simple script that users can run in their browser console
const browserScript = `
// Run this in your browser console at http://localhost:5175
// It will generate and download the PWA icons

function generateIcon(size, filename) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // White circle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.4, size * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Checkmark
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(size * 0.42, size * 0.4);
  ctx.lineTo(size * 0.48, size * 0.46);
  ctx.lineTo(size * 0.58, size * 0.34);
  ctx.stroke();

  // Star
  ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
  ctx.beginPath();
  ctx.arc(size * 0.75, size * 0.7, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Star points
  ctx.fillStyle = 'white';
  const starSize = size * 0.08;
  const centerX = size * 0.75;
  const centerY = size * 0.7;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * starSize;
    const y = centerY + Math.sin(angle) * starSize;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Download
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// Generate both icons
console.log('Generating icons...');
generateIcon(192, 'icon-192.png');
setTimeout(() => generateIcon(512, 'icon-512.png'), 1000);
console.log('Icons will download shortly. Place them in the public/ folder.');
`;

fs.writeFileSync(
  path.join(__dirname, 'public', 'generate-icons-browser.js'),
  browserScript
);

console.log('Created: public/generate-icons-browser.js');
console.log('');
console.log('To generate icons:');
console.log('1. Open http://localhost:5175 in your browser');
console.log('2. Open browser console (F12)');
console.log('3. Copy and paste the content of public/generate-icons-browser.js');
console.log('4. Press Enter - icons will download');
console.log('5. Move downloaded icons to public/ folder');
