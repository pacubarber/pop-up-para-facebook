// usage: node render.mjs page.html out.mp4 duration [--stills t1,t2,...]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import path from 'path';
const [,, page_, out, dur, flag, list] = process.argv;
const FPS = 30;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('PAGEERR', e.message));
await page.goto('file://' + path.resolve(page_));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
if (flag === '--stills') {
  for (const t of list.split(',')) {
    await page.evaluate(t => seek(t), +t);
    await page.screenshot({ path: `${out}_${t}.jpg`, type: 'jpeg', quality: 70 });
  }
} else {
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.ceil(+dur * FPS);
  for (let i = 0; i < N; i++) {
    await page.evaluate(t => seek(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log('frame', i, '/', N);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
await browser.close();
