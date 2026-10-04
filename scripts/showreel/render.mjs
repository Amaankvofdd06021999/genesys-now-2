import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';

const dir = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.woff2': 'font/woff2', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
}).listen(0);
const port = server.address().port;

const mode = process.argv[2] || 'stills';
const FFMPEG = path.join(os.homedir(), 'Library/Caches/ms-playwright/ffmpeg-1011/ffmpeg-mac');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/reel.html?t=0`);
await page.evaluate(() => window.ready);
const canvas = await page.$('canvas');
const shot = async t => { await page.evaluate(t => window.render(t), t); return canvas.screenshot(mode === 'stills' ? { type: 'png' } : { type: 'jpeg', quality: 95 }); };

if (mode === 'stills') {
  fs.mkdirSync(path.join(dir, 'stills'), { recursive: true });
  const ts = process.argv.slice(3).map(Number);
  for (const t of ts) fs.writeFileSync(path.join(dir, 'stills', `t${t.toFixed(2)}.png`), await shot(t));
} else {
  const fps = 30, dur = await page.evaluate(() => window.DUR), out = process.argv[3];
  const ff = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', 'pipe:0',
    '-c:v', 'libvpx', '-b:v', '5M', '-crf', '8', '-qmin', '2', '-qmax', '30', '-pix_fmt', 'yuv420p', '-an', '-auto-alt-ref', '0', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.on('exit', c => { if (c) { console.error('ffmpeg exited', c); process.exit(1); } });
  const n = Math.round(dur * fps);
  for (let i = 0; i < n; i++) {
    const buf = await shot(i / fps);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`frame ${i}/${n}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
await browser.close();
server.close();
