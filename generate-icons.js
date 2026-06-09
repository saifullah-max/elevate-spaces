const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// Icon configurations
const icons = [
  {
    name: 'icon-192.png',
    size: 192,
    text: 'ES',
    bgColor: '#6366f1',
    textColor: '#FFFFFF',
    fontSize: 80
  },
  {
    name: 'icon-512.png',
    size: 512,
    text: 'ES',
    bgColor: '#6366f1',
    textColor: '#FFFFFF',
    fontSize: 220
  },
  {
    name: 'icon-maskable-192.png',
    size: 192,
    text: 'ES',
    bgColor: '#6366f1',
    textColor: '#FFFFFF',
    fontSize: 80
  },
  {
    name: 'icon-maskable-512.png',
    size: 512,
    text: 'ES',
    bgColor: '#6366f1',
    textColor: '#FFFFFF',
    fontSize: 220
  },
  {
    name: 'icon-upload-96.png',
    size: 96,
    text: '⬆',
    bgColor: '#FFFFFF',
    textColor: '#6366f1',
    fontSize: 60
  },
  {
    name: 'icon-history-96.png',
    size: 96,
    text: '⏱',
    bgColor: '#FFFFFF',
    textColor: '#6366f1',
    fontSize: 60
  }
];

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Create SVG with text
function createSvg(size, text, bgColor, textColor, fontSize) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${bgColor}"/>
    <text x="50%" y="50%" font-size="${fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-family="Arial, sans-serif">
      ${text}
    </text>
  </svg>`;
}

// Generate each icon
async function generateIcons() {
  try {
    for (const icon of icons) {
      const svg = createSvg(icon.size, icon.text, icon.bgColor, icon.textColor, icon.fontSize);
      const outputPath = path.join(publicDir, icon.name);
      
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Created ${icon.name}`);
    }
    
    console.log('\n✅ All icons created successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
