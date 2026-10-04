'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotion } from './motion-context';

const panels = [
  { name: 'Discover.', caption: 'THE RIGHT QUESTION CHANGES EVERYTHING', tone: 'red', number: '01', kind: 'type' },
  { name: 'A clearer way.', caption: 'MAP / UNDERSTAND / ALIGN', tone: 'ink', number: '02', kind: 'list' },
  { name: 'Built around you.', caption: 'YOUR OPERATIONS. YOUR SYSTEM.', tone: 'paper', number: '03', kind: 'blocks' },
  { name: 'Connect.', caption: 'SEPARATE TOOLS. SHARED INTELLIGENCE.', tone: 'red', number: '04', kind: 'network' },
  { name: 'Less friction.', caption: 'MAKE SPACE FOR BETTER WORK', tone: 'ink', number: '05', kind: 'bars' },
  { name: 'Keep evolving.', caption: 'BUILT FOR WHAT COMES NEXT', tone: 'paper', number: '06', kind: 'type' },
];

/** A continuous, perspective-warped ribbon of original HTML panels. */
export default function SystemRibbon() {
  const host = useRef<HTMLDivElement>(null);
  const allowedMotion = useMotion();
  const [paused, setPaused] = useState(false);
  const phaseRef = useRef(0);
  const motion = allowedMotion && !paused;

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const cards = [...element.querySelectorAll<HTMLElement>('.ribbon-card')];
    let frame = 0, last = 0, phase = phaseRef.current, visible = true, pointer = 0, target = 0;
    let width = element.clientWidth, height = element.clientHeight;
    const observe = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observe.observe(element);
    const resize = new ResizeObserver(() => { width = element.clientWidth; height = element.clientHeight; if (!motion) paint(0); });
    resize.observe(element);
    const move = (event: PointerEvent) => { const box = element.getBoundingClientRect(); target = (event.clientX - box.left) / width - .5; };
    const leave = () => { target = 0; };
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerleave', leave);

    function paint(stamp: number) {
      if (motion) frame = requestAnimationFrame(paint);
      if (motion && (!visible || document.hidden || stamp - last < 32)) return;
      const delta = Math.min((stamp - last) / 1000, .05);
      last = stamp;
      if (motion) phase += delta * 32;
      phaseRef.current = phase;
      pointer += (target - pointer) * .055;
      const spacing = Math.min(width * .31, 170);
      const total = spacing * cards.length;
      cards.forEach((card, index) => {
        const y = ((index * spacing + phase + total) % total) - total / 2;
        const curve = y / (height * .64);
        const x = Math.sin(curve * 2.3) * width * .13;
        const twist = Math.sin(curve * 1.9) * -24;
        const depth = Math.cos(curve * 1.7) * 70;
        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${depth}px) rotateX(${curve * -13}deg) rotateY(${twist + pointer * 15}deg) rotateZ(${Math.sin(curve * 2) * 13 - 9}deg)`;
        card.style.opacity = String(Math.max(0, Math.min(1, (height * .68 - Math.abs(y)) / 95)));
        card.style.zIndex = String(Math.round(1000 + y));
      });
    }
    paint(0);
    return () => { cancelAnimationFrame(frame); observe.disconnect(); resize.disconnect(); element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', leave); };
  }, [motion]);

  return <div className="system-ribbon" ref={host} role="group" aria-label="A flowing ribbon of red, black and white panels: discover, build, connect and evolve.">
    {allowedMotion && <button className="ribbon-toggle" onClick={() => setPaused(p => !p)} aria-pressed={paused}>{paused ? 'Play animation' : 'Pause animation'}<span aria-hidden="true">{paused ? '+' : 'Ⅱ'}</span></button>}
    <div className="ribbon-guide ribbon-guide-left" aria-hidden="true"><span>GENESYS / IN CONTINUOUS MOTION</span></div>
    <div className="ribbon-guide ribbon-guide-right" aria-hidden="true"><span>06 CONNECTED CAPABILITIES</span></div>
    <div className="ribbon-perspective" aria-hidden="true">{panels.map(panel => <div className={'ribbon-card ribbon-' + panel.tone + ' ribbon-kind-' + panel.kind} key={panel.number}>
      <div className="ribbon-card-header"><span>genesys<span className="ribbon-now">now</span></span><span>{panel.number} / 06</span></div>
      {panel.kind === 'list' ? <div className="ribbon-list"><span>01 <b>DISCOVER</b><i>Make it clear.</i></span><span>02 <b>DESIGN</b><i>Make it useful.</i></span><span>03 <b>DEVELOP</b><i>Make it work.</i></span></div> : panel.kind === 'blocks' ? <div className="ribbon-blocks"><strong>{panel.name}</strong><div><i/><i/><i/><i/></div></div> : panel.kind === 'network' ? <div className="ribbon-network"><strong>{panel.name}</strong><div><i/><i/><i/></div></div> : panel.kind === 'bars' ? <div className="ribbon-bars"><strong>{panel.name}</strong><div>{Array.from({length:8},(_,i)=><i key={i} style={{height: `${25 + i * 9}%`}}/>)}</div></div> : <strong className="ribbon-title">{panel.name}</strong>}
      <div className="ribbon-card-footer"><span>{panel.caption}</span><span>+</span></div>
    </div>)}</div>
    <span className="ribbon-caption" aria-hidden="true">ONE PARTNER. EVERY CONNECTION.</span>
  </div>;
}

export function SystemsMap() {
  return <div className="systems-map">
    <div className="systems-map-caption"><span>FIG. 01 / A CONNECTED BUSINESS</span><span>DESIGNED AS ONE SYSTEM</span></div>
    <div className="systems-map-body">
      <svg className="system-lines" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true"><g fill="none"><path d="M130 150H260C300 150 280 55 335 55H465M260 150H465M260 150C300 150 280 245 335 245H465M535 55H630C680 55 660 150 715 150H880M535 150H880M535 245H630C680 245 660 150 715 150"/><path className="system-pulse" d="M130 150H260C300 150 280 55 335 55H630C680 55 660 150 715 150H880"/></g></svg>
      <div className="system-node system-origin"><span className="system-node-plus">+</span><strong>Your business</strong><small>PEOPLE / OPERATIONS / GOALS</small></div>
      <div className="system-node-group"><div className="system-node"><strong>Applications</strong><small>BUILD</small></div><div className="system-node"><strong>Integrations</strong><small>CONNECT</small></div><div className="system-node"><strong>Automation</strong><small>SIMPLIFY</small></div></div>
      <div className="system-node system-result"><strong>One foundation.</strong><small>LESS FRICTION. MORE POSSIBILITY.</small></div>
    </div>
  </div>;
}
