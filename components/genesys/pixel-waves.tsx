'use client';
import { useEffect, useRef } from 'react';
import { useMotion } from './motion-context';

// A damped wave equation on a coarse pixel lattice. Pointer movement drops
// impulses; each cell is drawn as a square whose shade follows its height.
const CELL = 14;
const SHADES = ['#7d1020', '#94142a', '#b0172a', '#c81e30', '#d82735', '#e53a46', '#ee4650', '#f58a90', '#ffd0d3'];

export default function PixelWaves() {
  const host = useRef<HTMLDivElement>(null);
  const motion = useMotion();

  useEffect(() => {
    const el = host.current; if (!el) return;
    const canvas = document.createElement('canvas'); el.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    let cols = 0, rows = 0, w = 0, h = 0, frame = 0, last = 0, tick = 0, visible = false;
    let prev = new Float32Array(0), curr = new Float32Array(0), next = new Float32Array(0);

    const layout = () => {
      const dpr = Math.min(devicePixelRatio, 2); w = el.clientWidth; h = el.clientHeight; if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
      prev = new Float32Array(cols * rows); curr = new Float32Array(cols * rows); next = new Float32Array(cols * rows);
    };
    const impulse = (cx: number, cy: number, strength: number) => {
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
        const x = cx + i, y = cy + j; if (x > 0 && x < cols - 1 && y > 0 && y < rows - 1) curr[y * cols + x] += strength * Math.exp(-(i * i + j * j) / 2);
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const gap = 2;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const v = curr[y * cols + x];
        const k = Math.max(0, Math.min(SHADES.length - 1, Math.round(4 + v * 3)));
        ctx.fillStyle = SHADES[k];
        // Crests lift slightly so the surface reads as raised pixels.
        const lift = Math.max(0, v) * 2;
        ctx.fillRect(x * CELL, y * CELL - lift, CELL - gap, CELL - gap);
      }
    };
    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      if (!visible || document.hidden || now - last < 32) return; last = now;
      if (tick++ % 90 === 0) impulse(Math.round(cols * (.5 + Math.sin(tick * .031) * .3)), Math.round(rows * (.5 + Math.cos(tick * .023) * .3)), 2.4);
      for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) {
        const i = y * cols + x;
        next[i] = ((curr[i - 1] + curr[i + 1] + curr[i - cols] + curr[i + cols]) * .5 - prev[i]) * .985;
      }
      const t = prev; prev = curr; curr = next; next = t;
      draw();
    };
    const move = (e: PointerEvent) => {
      if (!motion) return;
      const b = el.getBoundingClientRect(); impulse(Math.floor((e.clientX - b.left) / CELL), Math.floor((e.clientY - b.top) / CELL), .8);
    };
    const ro = new ResizeObserver(() => { layout(); impulse(cols >> 1, rows >> 1, 3); draw(); });
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    ro.observe(el); io.observe(el);
    el.addEventListener('pointermove', move); el.addEventListener('pointerdown', move);
    if (motion) frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); el.removeEventListener('pointermove', move); el.removeEventListener('pointerdown', move); canvas.remove(); };
  }, [motion]);

  return <div ref={host} className="fluid-canvas pixel-waves" role="img" aria-label="A field of red pixels that ripples as you move across it" />;
}
