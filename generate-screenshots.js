const sharp = require('sharp');
const path = require('path');

const screenshots = [
  { name: 'screenshot-1.png', width: 540, height: 720, label: 'Mobile' },
  { name: 'screenshot-2.png', width: 1280, height: 720, label: 'Desktop' }
];

async function createScreenshots() {
  for (const screenshot of screenshots) {
    const svg = `<svg width="${screenshot.width}" height="${screenshot.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${screenshot.width}" height="${screenshot.height}" fill="url(#grad)"/>
      <text x="50%" y="40%" font-size="60" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
        Elevate Spaces
      </text>
      <text x="50%" y="55%" font-size="30" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif">
        AI Virtual Staging
      </text>
      <rect x="${screenshot.width * 0.1}" y="${screenshot.height * 0.65}" width="${screenshot.width * 0.8}" height="${screenshot.height * 0.25}" fill="rgba(255,255,255,0.1)" rx="10"/>
      <text x="50%" y="80%" font-size="20" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif">
        ${screenshot.label} Screenshot
      </text>
    </svg>`;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join('public', screenshot.name));
    
    console.log(`✓ Created ${screenshot.name}`);
  }
  console.log('\n✅ Screenshots created successfully!');
}

createScreenshots().catch(console.error);
