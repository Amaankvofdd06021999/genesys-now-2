'use client';
import { useEffect, useState, type CSSProperties } from 'react';

// First-visit loading screen: the Genesys "g" assembles from pixels while a
// counter runs, then the screen dissolves in a diagonal tile wipe.
// Rendered on the server so it covers the page before hydration.

const MARK = [
  '...rrrrrrrrr',
  '..rrrrrrrrrr',
  '.rrmm.rrrrr.',
  '.rdd....rrr.',
  'rmmm....rrr.',
  '.rrr....rrr.',
  '.rrr...rrrr.',
  '.rrrrrrrrr..',
  '..rrrrrrr...',
  '.rrr........',
  '.rrr........',
  '.rrrrrrrrr..',
  '.rrrrrrrrrr.',
  '.mrrrrrrrrrr',
  'mrm.....rrrr',
  'rrr......rrr',
  'rrr.....rrrr',
  'rrrrrrrrrrr.',
  '.rrrrrrrrr..',
  '...rrrrr....',
];
const ROWS = MARK.length, COLS = MARK[0].length;
const TILE_COLS = 10, TILE_ROWS = 6, SEGMENTS = 12;
const MIN_MS = 1400, EXIT_MS = 900;
export const LOADER_KEY = 'genesys-loaded';

/** Runs before hydration: applies the saved theme, skips the loader for the rest of the
    session, otherwise holds page intros (released after 7s even if scripts never run). */
export const loaderBootScript = `try{var d=document.documentElement;if(localStorage.getItem('genesys-theme')==='dark')d.dataset.theme='dark';if(sessionStorage.getItem('${LOADER_KEY}'))d.dataset.loader='skip';else{d.dataset.loading='1';setTimeout(function(){delete d.dataset.loading},7000)}}catch(e){}`;

export default function LoadingScreen() {
  const [state, setState] = useState<'loading' | 'leaving' | 'done'>('loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.loader === 'skip') { delete root.dataset.loading; const f = requestAnimationFrame(() => setState('done')); return () => cancelAnimationFrame(f); }
    const begin = performance.now();
    let loaded = document.readyState === 'complete', frame = 0, shown = 0, exitTimer = 0;
    const onLoad = () => { loaded = true; };
    window.addEventListener('load', onLoad);
    const tick = (now: number) => {
      const elapsed = now - begin;
      // Ease toward 90 while assets load, then run out to 100.
      const target = loaded && elapsed > MIN_MS ? 100 : Math.min(90, elapsed / MIN_MS * 90);
      shown += (target - shown) * (target === 100 ? .2 : .08);
      if (target === 100 && shown > 99.5) shown = 100;
      setProgress(Math.round(shown));
      if (shown < 100) { frame = requestAnimationFrame(tick); return; }
      try { sessionStorage.setItem(LOADER_KEY, '1'); } catch {}
      // Release page intros as the tiles start to dissolve.
      delete root.dataset.loading;
      setState('leaving');
      exitTimer = window.setTimeout(() => setState('done'), EXIT_MS);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); clearTimeout(exitTimer); window.removeEventListener('load', onLoad); };
  }, []);

  if (state === 'done') return null;
  const lit = Math.round(progress / 100 * SEGMENTS);

  return <div className={'loader' + (state === 'leaving' ? ' is-leaving' : '')} role="status" aria-live="polite" aria-label={state === 'leaving' ? 'Loaded' : 'Loading Genesys Now'}>
    <div className="loader-tiles" aria-hidden="true">
      {Array.from({ length: TILE_COLS * TILE_ROWS }, (_, i) => <i key={i} style={{ '--t': (i % TILE_COLS) + Math.floor(i / TILE_COLS) } as CSSProperties} />)}
    </div>
    <div className="loader-core" aria-hidden="true">
      <div className="loader-mark" style={{ '--cols': COLS } as CSSProperties}>
        {MARK.flatMap((line, y) => [...line].map((ch, x) => ch === '.'
          ? <span key={`${x}-${y}`} />
          : <span key={`${x}-${y}`} className={'lc lc-' + ch} style={{ '--d': `${((ROWS - y) / ROWS * 700 + ((x * 7 + y * 13) % 5) * 45) | 0}ms`, '--g': `${(x + y) * 55}ms` } as CSSProperties} />))}
      </div>
      <div className="loader-meta"><span>Genesys Now</span><span className="loader-count">{String(progress).padStart(3, '0')}</span></div>
      <div className="loader-bar">{Array.from({ length: SEGMENTS }, (_, i) => <i key={i} className={i < lit ? 'on' : ''} />)}</div>
    </div>
  </div>;
}
