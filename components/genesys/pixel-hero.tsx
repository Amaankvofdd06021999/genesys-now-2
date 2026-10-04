'use client';
import { useEffect, useRef } from 'react';
import { useMotion } from './motion-context';
import { pixelScenes, type PixelSceneName } from './pixel-scenes';

// Pixel-art renditions of the Genesys brand, sampled from the icon or from set type.
// Pixels assemble on first view, idle-blink, and scatter away from the pointer.

type Source = { icon: string } | { text: string; font: string } | { grid: string[] };
type PixelArtProps = {
  source: Source;
  rows: number;
  /** Shades from darkest to lightest; the last one is the blink highlight. */
  palette: [string, string, string, string];
  /** 'box' centres the art inside the host; 'width' fills the host width and sets its height. */
  fit?: 'box' | 'width';
  /** Dot grid and drifting loose pixels. */
  decor?: boolean;
  /** Intro direction: pixels rise row by row, or sweep in column by column. */
  intro?: 'rows' | 'cols';
  className?: string;
  label: string;
};

type Px = { hx: number; hy: number; c: string; x: number; y: number; vx: number; vy: number; delay: number; lift: number };
type Loose = { x: number; y: number; s: number; v: number; kind: number; phase: number };

/** Marks pixels drawn in the theme foreground colour. */
const INK = 'ink';

function rand(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }; }

/** Samples the source into a rows-high alpha/shade grid. */
async function sample(source: Source, rows: number) {
  if ('grid' in source) return { cols: source.grid[0].length, data: null };
  let img: CanvasImageSource, sw: number, sh: number, sx = 0, sy = 0;
  if ('icon' in source) {
    const el = new Image(); el.src = source.icon; await el.decode();
    img = el; sw = el.width; sh = el.height;
  } else {
    if (!document.fonts.check(source.font)) await document.fonts.load(source.font);
    const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true })!;
    x.font = source.font; const m = x.measureText(source.text);
    c.width = Math.ceil(m.width + 40); c.height = Math.ceil((m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + 40);
    x.font = source.font; x.textBaseline = 'alphabetic'; x.fillStyle = '#000';
    x.fillText(source.text, 20, 20 + m.actualBoundingBoxAscent);
    // Crop to the inked area so the grid hugs the letterforms.
    const d = x.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 40) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    img = c; sx = x0; sy = y0; sw = x1 - x0 + 1; sh = y1 - y0 + 1;
  }
  const cols = Math.round(rows * sw / sh);
  const s = document.createElement('canvas'); s.width = cols; s.height = rows;
  const sctx = s.getContext('2d', { willReadFrequently: true })!; sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
  return { cols, data: sctx.getImageData(0, 0, cols, rows).data };
}

export function PixelArt({ source, rows, palette, fit = 'box', decor = false, intro = 'rows', className = '', label }: PixelArtProps) {
  const host = useRef<HTMLDivElement>(null);
  const motion = useMotion();
  const key = JSON.stringify([source, rows, palette, fit, decor, intro]);

  useEffect(() => {
    const el = host.current; if (!el) return;
    let disposed = false, frame = 0;
    const canvas = document.createElement('canvas'); el.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    const r = rand(7);
    const pixels: Px[] = []; let loose: Loose[] = [], cols = 0;
    let w = 0, h = 0, cell = 0, ox = 0, oy = 0;
    let fg = '#1b1b1b', grid = '#dcdcd7';
    const pointer = { x: -1e4, y: -1e4, on: false };
    let start = -1, visible = false;
    const [shadeDark, shadeMid, shadeMain, shadeLight] = palette;

    const readTheme = () => { const s = getComputedStyle(el); fg = s.getPropertyValue('--foreground').trim() || fg; grid = s.getPropertyValue('--border').trim() || grid; };

    const layout = () => {
      if (!cols) return;
      const dpr = Math.min(devicePixelRatio, 2); w = el.clientWidth;
      if (fit === 'width') { cell = w / cols; h = rows * cell + Math.ceil(cell * .5); el.style.height = h + 'px'; ox = 0; oy = Math.ceil(cell * .25); }
      else { h = el.clientHeight; cell = Math.floor(Math.min(h * .84 / rows, w * .8 / cols)); ox = Math.round((w - cols * cell) / 2); oy = Math.round((h - rows * cell) / 2); }
      if (!w || !h || !cell) return;
      canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const t = !motion ? 1e3 : start < 0 ? 0 : (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      if (decor) {
        // Dot grid aligned to the pixel lattice.
        ctx.fillStyle = grid;
        for (let x = ox % cell; x < w; x += cell) for (let y = oy % cell; y < h; y += cell) ctx.fillRect(x - .75, y - .75, 1.5, 1.5);
        // Loose pixels drifting up and to the right.
        for (const l of loose) {
          const s = cell * l.s, a = .35 + .35 * Math.sin(t * 1.3 + l.phase);
          ctx.globalAlpha = Math.min(1, t / 2) * a;
          if (l.kind === 2) { ctx.strokeStyle = fg; ctx.lineWidth = 1; ctx.strokeRect(l.x + .5, l.y + .5, s - 1, s - 1); }
          else { ctx.fillStyle = l.kind === 0 ? shadeMain : fg; ctx.fillRect(l.x, l.y, s, s); }
        }
        ctx.globalAlpha = 1;
      }
      // The mark.
      const gap = Math.max(1, Math.round(cell * .1));
      for (const p of pixels) {
        const k = Math.min(1, Math.max(0, (t - p.delay) / .7)); if (k <= 0) continue;
        const e = 1 - Math.pow(1 - k, 3);
        const drop = (1 - e) * cell * 6;
        const x = ox + (p.hx + p.x) * cell, y = oy + (p.hy + p.y - p.lift * .35) * cell + drop;
        ctx.globalAlpha = e;
        ctx.fillStyle = p.c === INK ? fg : p.lift > .3 ? shadeLight : p.c;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(cell - gap), Math.round(cell - gap));
      }
      ctx.globalAlpha = 1;
      // Snapped pixel cursor.
      if (pointer.on) {
        const gx = Math.floor((pointer.x - ox) / cell), gy = Math.floor((pointer.y - oy) / cell);
        const cx = ox + gx * cell, cy = oy + gy * cell;
        ctx.strokeStyle = fg; ctx.lineWidth = 1.5; ctx.strokeRect(cx - 2, cy - 2, cell + 4 - gap, cell + 4 - gap);
      }
    };

    let last = 0, nextBlink = 0;
    const step = (now: number) => {
      if (disposed) return; frame = requestAnimationFrame(step);
      if (!visible || document.hidden) { last = now; return; }
      // Hold the intro until the loading screen lifts.
      if (start < 0) { if (document.documentElement.dataset.loading) { last = now; return; } start = now; }
      const dt = Math.min((now - last) / 16.67, 3); last = now;
      if ((frame & 31) === 0) readTheme();
      const px = (pointer.x - ox) / cell, py = (pointer.y - oy) / cell;
      for (const p of pixels) {
        if (pointer.on) {
          const dx = p.hx + p.x + .5 - px, dy = p.hy + p.y + .5 - py, d2 = dx * dx + dy * dy;
          if (d2 < 16 && d2 > .001) { const f = (16 - d2) / 16 * .09; const d = Math.sqrt(d2); p.vx += dx / d * f * dt; p.vy += dy / d * f * dt; }
        }
        p.vx += -p.x * .06 * dt; p.vy += -p.y * .06 * dt; p.vx *= Math.pow(.82, dt); p.vy *= Math.pow(.82, dt);
        p.x += p.vx * dt; p.y += p.vy * dt; p.lift *= Math.pow(.94, dt);
      }
      if (now > nextBlink && pixels.length) { pixels[Math.floor(Math.random() * pixels.length)].lift = 1; nextBlink = now + 90 + Math.random() * 160; }
      for (const l of loose) { l.y -= l.v * dt; l.x += l.v * .35 * dt; if (l.y < -cell || l.x > w + cell) { l.y = h + cell * Math.random() * 3; l.x = Math.random() * w * .9; } }
      draw(now);
    };

    const point = (e: PointerEvent) => { const b = el.getBoundingClientRect(); pointer.x = e.clientX - b.left; pointer.y = e.clientY - b.top; pointer.on = true; if (!motion) draw(performance.now()); };
    const leave = () => { pointer.on = false; pointer.x = pointer.y = -1e4; if (!motion) draw(performance.now()); };
    const ro = new ResizeObserver(() => { layout(); seedLoose(); if (!motion) draw(1e9); });
    // The intro starts on the first frame the art is actually on screen.
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    const themeObs = new MutationObserver(() => { readTheme(); if (!motion) draw(1e9); });

    function seedLoose() {
      loose = decor ? Array.from({ length: 16 }, (_, i) => ({ x: r() * w, y: r() * h, s: i % 5 === 0 ? 1 : .55, v: .15 + r() * .35, kind: i % 3, phase: r() * 6 })) : [];
    }

    sample(source, rows).then(({ cols: c, data }) => {
      if (disposed) return;
      cols = c;
      if ('grid' in source) {
        const shade: Record<string, string> = { d: shadeDark, m: shadeMid, r: shadeMain, l: shadeLight, k: INK };
        source.grid.forEach((line, y) => [...line].forEach((ch, x) => {
          if (!shade[ch]) return;
          const c = ch === 'r' && r() < .05 ? shadeLight : shade[ch];
          pixels.push({ hx: x, hy: y, c, x: 0, y: 0, vx: 0, vy: 0, delay: intro === 'cols' ? x / cols * 1.2 + r() * .3 : (rows - y) / rows * 1.1 + r() * .35, lift: 0 });
        }));
      }
      if (data) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4; if (data[i + 3] < 110) continue;
        // Icons carry their own shading in the red channel; set type shades by coverage.
        let c: string;
        if ('icon' in source) { const tone = data[i]; c = tone > 175 ? shadeMain : tone > 140 ? shadeMid : shadeDark; }
        else c = data[i + 3] > 200 ? shadeMain : shadeMid;
        if (c === shadeMain && r() < ('icon' in source ? .06 : .025)) c = shadeLight;
        const delay = intro === 'cols' ? x / cols * 1.2 + r() * .3 : (rows - y) / rows * 1.1 + r() * .35;
        pixels.push({ hx: x, hy: y, c, x: 0, y: 0, vx: 0, vy: 0, delay, lift: 0 });
      }
      readTheme(); layout(); seedLoose();
      el.addEventListener('pointermove', point); el.addEventListener('pointerleave', leave);
      const b = el.getBoundingClientRect(); if (b.bottom > 0 && b.top < innerHeight) visible = true;
      ro.observe(el); io.observe(el); themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      if (motion) frame = requestAnimationFrame(step); else draw(1e9);
    }).catch(() => {});

    return () => { disposed = true; cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); themeObs.disconnect(); el.removeEventListener('pointermove', point); el.removeEventListener('pointerleave', leave); canvas.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motion, key]);

  return <div ref={host} className={'pixel-art ' + className} role="img" aria-label={label} />;
}

const HERO_REDS: PixelArtProps['palette'] = ['#7d1020', '#b0172a', '#d82735', '#ee4650'];

export default function PixelHero() {
  return <PixelArt className="pixel-hero" source={{ icon: '/brand/genesys-icon.png' }} rows={34} palette={HERO_REDS} decor label="The Genesys g, drawn in red pixels" />;
}

/** A hand-drawn pixel scene that assembles in place and reacts to the pointer. */
export function PixelScene({ name, label, className = '' }: { name: PixelSceneName; label: string; className?: string }) {
  const grid = pixelScenes[name];
  return <PixelArt className={'pixel-scene ' + className} source={{ grid }} rows={grid.length} palette={HERO_REDS} decor label={label} />;
}
