#!/usr/bin/env node

/**
 * Automated PWA Icon Generator
 * Generates all required PWA icons from SVG source
 * Runs automatically during build process
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SVG icon template
const iconSVG = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background gradient -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- White circle (checkmark background) -->
  <circle cx="256" cy="205" r="102" fill="rgba(255, 255, 255, 0.9)"/>

  <!-- Checkmark -->
  <path d="M 215 205 L 245 235 L 300 180"
        stroke="#667eea"
        stroke-width="20"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"/>

  <!-- Gold star (points) -->
  <circle cx="385" cy="360" r="51" fill="rgba(255, 215, 0, 0.9)"/>

  <!-- Star inner white points -->
  <path d="M 385 330 L 395 355 L 420 360 L 395 375 L 395 400 L 385 380 L 375 400 L 375 375 L 350 360 L 375 355 Z"
        fill="white"/>

  <!-- Family icons (3 circles at bottom) -->
  <circle cx="150" cy="435" r="20" fill="rgba(255, 255, 255, 0.8)"/>
  <circle cx="256" cy="435" r="20" fill="rgba(255, 255, 255, 0.8)"/>
  <circle cx="362" cy="435" r="20" fill="rgba(255, 255, 255, 0.8)"/>
</svg>
`;

// Icon sizes to generate
const sizes = [
  { size: 96, filename: 'icon-96.png' },
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' }
];

async function generateIcons() {
  const publicDir = join(__dirname, '..', 'public');

  // Ensure public directory exists
  try {
    mkdirSync(publicDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }

  console.log('🎨 Generating PWA icons...\n');

  for (const { size, filename } of sizes) {
    try {
      const outputPath = join(publicDir, filename);

      await sharp(Buffer.from(iconSVG))
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${filename} (${size}x${size})`);
    } catch (err) {
      console.error(`❌ Failed to generate ${filename}:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n✨ All PWA icons generated successfully!');
  console.log(`📁 Icons saved to: ${publicDir}\n`);
}

// Run the generator
generateIcons().catch(err => {
  console.error('❌ Icon generation failed:', err);
  process.exit(1);
});
