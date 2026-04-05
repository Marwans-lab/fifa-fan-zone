#!/usr/bin/env node
/**
 * Generates gradient PNG background images for all 48 World Cup teams.
 * Uses Node.js built-in zlib — no external dependencies required.
 * Output: src/assets/images/Team-backgrounds/{TeamName}.png  (400×560px)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Team data: [id, name, color1, color2]
const TEAMS = [
  ['dz', 'Algeria',               '#006233', '#FFFFFF'],
  ['ar', 'Argentina',             '#1D4E8E', '#54A0D3'],
  ['au', 'Australia',             '#012169', '#C8102E'],
  ['at', 'Austria',               '#ED2939', '#1a1a1a'],
  ['be', 'Belgium',               '#1a1400', '#EF3340'],
  ['ba', 'Bosnia_and_Herzegovina','#1D428A', '#FFCD00'],
  ['br', 'Brazil',                '#009C3B', '#002776'],
  ['ca', 'Canada',                '#C8102E', '#8b0000'],
  ['cv', 'Cape_Verde',            '#003893', '#CE1126'],
  ['co', 'Colombia',              '#003087', '#FCD116'],
  ['hr', 'Croatia',               '#FF0000', '#003DA5'],
  ['cw', 'Curacao',               '#003893', '#F9DC00'],
  ['cz', 'Czechia',               '#11457E', '#D7141A'],
  ['cd', 'DR_Congo',              '#007FFF', '#F7D618'],
  ['ec', 'Ecuador',               '#003893', '#FFD100'],
  ['eg', 'Egypt',                 '#CE1126', '#1a1a1a'],
  ['gb-eng', 'England',           '#CF142B', '#1C3557'],
  ['fr', 'France',                '#0055A4', '#EF4135'],
  ['de', 'Germany',               '#1a1a1a', '#DD0000'],
  ['gh', 'Ghana',                 '#006B3F', '#FCD116'],
  ['ht', 'Haiti',                 '#00209F', '#D21034'],
  ['ir', 'Iran',                  '#239F40', '#C8373D'],
  ['iq', 'Iraq',                  '#CE1126', '#000000'],
  ['ci', 'Ivory_Coast',           '#F77F00', '#009A44'],
  ['jp', 'Japan',                 '#1a0003', '#BC002D'],
  ['jo', 'Jordan',                '#000000', '#007A3D'],
  ['mx', 'Mexico',                '#006847', '#CE1126'],
  ['ma', 'Morocco',               '#C1272D', '#006233'],
  ['nl', 'Netherlands',           '#AE1C28', '#21468B'],
  ['nz', 'New_Zealand',           '#00247D', '#CC142B'],
  ['no', 'Norway',                '#EF2B2D', '#002868'],
  ['pa', 'Panama',                '#DA121A', '#003087'],
  ['py', 'Paraguay',              '#D52B1E', '#003DA5'],
  ['pt', 'Portugal',              '#046A38', '#DA291C'],
  ['qa', 'Qatar',                 '#8D1B3D', '#1a0d17'],
  ['sa', 'Saudi_Arabia',          '#006C35', '#1a2a1a'],
  ['gb-sct', 'Scotland',          '#003DA5', '#005EB8'],
  ['sn', 'Senegal',               '#00853F', '#E31B23'],
  ['za', 'South_Africa',          '#007A4D', '#001489'],
  ['kr', 'South_Korea',           '#CD2E3A', '#003478'],
  ['es', 'Spain',                 '#AA151B', '#c99600'],
  ['se', 'Sweden',                '#006AA7', '#FECC02'],
  ['ch', 'Switzerland',           '#D52B1E', '#8b0000'],
  ['tn', 'Tunisia',               '#E70013', '#8b0000'],
  ['tr', 'Turkiye',               '#E30A17', '#FFFFFF'],
  ['us', 'United_States',         '#0A3161', '#B31942'],
  ['uy', 'Uruguay',               '#0038A8', '#001f6b'],
  ['uz', 'Uzbekistan',            '#00AAAD', '#1EB53A'],
];

// The 5 teams that already have real images — skip generating for these
const SKIP = new Set(['dz', 'br', 'fr', 'qa', 'es']);

const WIDTH  = 400;
const HEIGHT = 560;
const OUTPUT_DIR = path.join(__dirname, '../src/assets/images/Team-backgrounds');

// ── PNG helpers ──────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h[0]+h[0]+h[1]+h[1]+h[2]+h[2]
    : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function generateGradientPNG(color1Hex, color2Hex) {
  const [r1, g1, b1] = hexToRgb(color1Hex);
  const [r2, g2, b2] = hexToRgb(color2Hex);

  // Build raw image: diagonal gradient (top-left=color1, bottom-right=color2)
  // Each row = filter byte (0 = None) + RGB pixels
  const rows = [];
  for (let y = 0; y < HEIGHT; y++) {
    const row = Buffer.alloc(1 + WIDTH * 3);
    row[0] = 0; // filter: None
    for (let x = 0; x < WIDTH; x++) {
      // diagonal gradient: t = average of x/W and y/H
      const t = (x / (WIDTH - 1) + y / (HEIGHT - 1)) / 2;
      row[1 + x * 3 + 0] = lerp(r1, r2, t);
      row[1 + x * 3 + 1] = lerp(g1, g2, t);
      row[1 + x * 3 + 2] = lerp(b1, b2, t);
    }
    rows.push(row);
  }
  const rawData = Buffer.concat(rows);
  const compressed = zlib.deflateSync(rawData, { level: 6 });

  // PNG signature
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH,  0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8]  = 8;  // bit depth
  ihdr[9]  = 2;  // colour type: RGB
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend),
  ]);
}

// ── Main ─────────────────────────────────────────────────────────────────────

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let generated = 0;
let skipped   = 0;

for (const [id, name, c1, c2] of TEAMS) {
  const filename = `${name}.png`;
  const outPath  = path.join(OUTPUT_DIR, filename);

  if (SKIP.has(id) && fs.existsSync(outPath)) {
    console.log(`  skip   ${filename}  (real image exists)`);
    skipped++;
    continue;
  }

  const png = generateGradientPNG(c1, c2);
  fs.writeFileSync(outPath, png);
  console.log(`  wrote  ${filename}  (${png.length} bytes)`);
  generated++;
}

console.log(`\nDone: ${generated} generated, ${skipped} skipped.`);
