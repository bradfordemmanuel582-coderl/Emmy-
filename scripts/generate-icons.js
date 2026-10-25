import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);

  return Buffer.concat([lenBuf, combined, crcBuf]);
}

function generatePng(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width, height, bitDepth=8, colorType=6 (RGBA), compression=0, filter=0, interlace=0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw pixel data: scanlines with filter byte 0
  const rowBytes = width * 4;
  const rawData = Buffer.alloc((1 + rowBytes) * height);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    const ny = y / height;

    for (let x = 0; x < width; x++) {
      const nx = x / width;

      // Emerald gradient background
      let r = 5;
      let g = Math.floor(150 + ny * 35);
      let b = Math.floor(120 + nx * 40);
      let a = 255;

      // Draw stylized bars in the center
      const cx = (x - width * 0.2) / (width * 0.6);
      const cy = y / height;

      // Bars: 4 bars
      const barIdx = Math.floor(cx * 4);
      const inBarX = (cx * 4) - barIdx;
      const barHeights = [0.4, 0.55, 0.75, 0.9];

      if (cx >= 0 && cx <= 1 && cy >= 0.25 && cy <= 0.85) {
        if (inBarX >= 0.2 && inBarX <= 0.8) {
          const h = barHeights[barIdx];
          if (cy >= 0.85 - h * 0.6) {
            // Bar color: dark slate with emerald cap
            if (cy <= 0.85 - h * 0.6 + 0.05) {
              r = 255; g = 255; b = 255; // White / neon cap
            } else {
              r = 9; g = 9; b = 11; // Dark slate body
            }
          }
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180));

console.log('Successfully generated all PWA PNG icons!');
