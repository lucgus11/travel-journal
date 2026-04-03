#!/usr/bin/env node
// Script to generate PWA icons from SVG
// Run: node scripts/gen-icons.js
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const sizes = [192, 512];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0d0d1a';
  const r = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Gold circle
  ctx.strokeStyle = '#d4a853';
  ctx.lineWidth = size * 0.04;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.43, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ✈️ emoji
  ctx.font = `${size * 0.55}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✈️', size / 2, size / 2 + size * 0.02);

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(`public/pwa-${size}.png`, buffer);
  console.log(`Generated pwa-${size}.png`);
}
