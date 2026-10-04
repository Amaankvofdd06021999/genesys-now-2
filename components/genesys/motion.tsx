'use client';
import { useEffect, type RefObject } from 'react';

// Small motion helpers, timings come from the --t-* tokens in globals.css.

/** Glides an indicator element between items: follows hover, settles back on the active item. */
export function useSlidingIndicator(container: RefObject<HTMLElement | null>, itemSelector: string, activeSelector: string, deps: unknown[] = [], followHover = true) {
  useEffect(() => {
    const root = container.current; if (!root) return;
    const bar = root.querySelector<HTMLElement>(':scope > .t-slide-indicator'); if (!bar) return;
    let placed = false;
    const place = (el: HTMLElement | null) => {
      if (!el) { bar.style.opacity = '0'; return; }
      const r = root.getBoundingClientRect(), b = el.getBoundingClientRect();
      // First placement jumps into position so the bar never sweeps in from the edge.
      if (!placed) { bar.style.transition = 'none'; }
      bar.style.width = b.width + 'px'; bar.style.height = b.height + 'px';
      bar.style.transform = `translate(${b.left - r.left}px, ${b.top - r.top}px)`;
      bar.style.opacity = '1';
      if (!placed) { void bar.offsetWidth; bar.style.transition = ''; placed = true; }
    };
    const active = () => root.querySelector<HTMLElement>(activeSelector);
    const over = (e: PointerEvent) => { const item = (e.target as HTMLElement).closest<HTMLElement>(itemSelector); if (item && root.contains(item)) place(item); };
    const out = () => place(active());
    const sync = () => { placed = false; place(active()); };
    sync();
    const mo = new MutationObserver(() => place(active()));
    mo.observe(root, { subtree: true, attributes: true, attributeFilter: ['class', 'data-state', 'aria-current'] });
    const ro = new ResizeObserver(sync); ro.observe(root);
    if (followHover) { root.addEventListener('pointerover', over); root.addEventListener('pointerleave', out); root.addEventListener('focusout', out); }
    return () => { mo.disconnect(); ro.disconnect(); root.removeEventListener('pointerover', over); root.removeEventListener('pointerleave', out); root.removeEventListener('focusout', out); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Tilts `.t-tilt-card` children of the root toward the pointer with a tracked glare. */
export function useTilt(root: RefObject<HTMLElement | null>, max = 7) {
  useEffect(() => {
    const host = root.current; if (!host || matchMedia('(hover: none)').matches) return;
    const cards = [...host.querySelectorAll<HTMLElement>('.t-tilt')];
    const off = cards.map(wrap => {
      const card = wrap.querySelector<HTMLElement>('.t-tilt-card'); if (!card) return () => {};
      const move = (e: PointerEvent) => {
        if (document.documentElement.dataset.motion === 'off') return;
        const b = wrap.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        card.classList.add('is-tilting'); wrap.classList.add('is-hover');
        card.style.setProperty('--tilt-rx', `${(.5 - y) * max}deg`); card.style.setProperty('--tilt-ry', `${(x - .5) * max}deg`);
        card.style.setProperty('--tilt-gx', `${x * 100}%`); card.style.setProperty('--tilt-gy', `${y * 100}%`);
      };
      const leave = () => { card.classList.remove('is-tilting'); wrap.classList.remove('is-hover'); card.style.setProperty('--tilt-rx', '0deg'); card.style.setProperty('--tilt-ry', '0deg'); };
      // Track on the flat wrapper so rotating edges never slip out from under the cursor.
      wrap.addEventListener('pointermove', move); wrap.addEventListener('pointerleave', leave);
      return () => { wrap.removeEventListener('pointermove', move); wrap.removeEventListener('pointerleave', leave); };
    });
    return () => off.forEach(f => f());
  });
}

/** Removes and re-adds a class so its animation replays. */
export function replay(el: HTMLElement | null, cls: string) {
  if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}
