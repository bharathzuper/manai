/* eslint-disable react/no-unknown-property */
import { useEffect, useRef, useState } from 'react';

// ────────────────────────────────────────────────────
// SplitText — char-by-char reveal with stagger
// ────────────────────────────────────────────────────
export function SplitText({
  text,
  delay = 0,
  duration = 0.9,
  stagger = 0.045,
  yFrom = 28,
  className = '',
  as: As = 'span',
}) {
  const chars = Array.from(text);
  return (
    <As className={className} aria-label={text} style={{ display: 'inline-block' }}>
      {chars.map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: 'inline-block',
            opacity: 0,
            transform: `translateY(${yFrom}px)`,
            animation: `rb-split-in ${duration}s cubic-bezier(0.2, 0.7, 0.2, 1) ${delay + i * stagger}s forwards`,
            whiteSpace: ch === ' ' ? 'pre' : 'normal',
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </As>
  );
}

// ────────────────────────────────────────────────────
// BlurText — blur → focus reveal
// ────────────────────────────────────────────────────
export function BlurText({ text, delay = 0, duration = 1.4, className = '' }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        animation: `rb-blur-in ${duration}s cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}s both`,
      }}
    >
      {text}
    </span>
  );
}

// ────────────────────────────────────────────────────
// ShinyText — animated gradient sweep shimmer
// ────────────────────────────────────────────────────
export function ShinyText({ text, speed = 4, className = '' }) {
  return (
    <span className={`rb-shiny ${className}`} style={{ animationDuration: `${speed}s` }}>
      {text}
    </span>
  );
}

// ────────────────────────────────────────────────────
// ScrollReveal — word-by-word reveal on viewport enter
// ────────────────────────────────────────────────────
export function ScrollReveal({
  text,
  threshold = 0.25,
  stagger = 0.06,
  duration = 0.8,
  yFrom = 16,
  className = '',
  as: As = 'span',
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  const words = text.split(' ');
  return (
    <As ref={ref} className={className}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: visible ? 1 : 0,
            filter: visible ? 'blur(0)' : 'blur(4px)',
            transform: visible ? 'translateY(0)' : `translateY(${yFrom}px)`,
            transition: `opacity ${duration}s ease ${i * stagger}s, transform ${duration}s cubic-bezier(0.2, 0.7, 0.2, 1) ${i * stagger}s, filter ${duration}s ease ${i * stagger}s`,
          }}
        >
          {w}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </As>
  );
}

// ────────────────────────────────────────────────────
// AnimatedContent — fade/translate wrapper on viewport enter
// ────────────────────────────────────────────────────
export function AnimatedContent({
  children,
  yFrom = 20,
  duration = 0.9,
  delay = 0,
  threshold = 0.15,
  className = '',
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${yFrom}px)`,
        transition: `opacity ${duration}s ease ${delay}s, transform ${duration}s cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────
// CountUp — number animation when entering viewport
// ────────────────────────────────────────────────────
export function CountUp({
  to,
  from = 0,
  duration = 2,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) {
  const ref = useRef(null);
  const [val, setVal] = useState(from);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now() + delay * 1000;
    let raf;
    const tick = (now) => {
      const elapsed = now - startTime;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to, from, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ────────────────────────────────────────────────────
// ClickSpark — canvas sparks on every click
// ────────────────────────────────────────────────────
export function ClickSpark({
  color = '#EAB308',
  count = 10,
  size = 14,
  duration = 520,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const sparks = [];
    const onClick = (e) => {
      const now = performance.now();
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
        sparks.push({ x: e.clientX, y: e.clientY, angle, start: now });
      }
    };
    window.addEventListener('click', onClick);

    let raf;
    const loop = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const p = (now - s.start) / duration;
        if (p >= 1) {
          sparks.splice(i, 1);
          continue;
        }
        const eased = 1 - Math.pow(1 - p, 2);
        const dist = size * 3.5 * eased;
        const x1 = s.x + Math.cos(s.angle) * (dist - size * 0.9);
        const y1 = s.y + Math.sin(s.angle) * (dist - size * 0.9);
        const x2 = s.x + Math.cos(s.angle) * dist;
        const y2 = s.y + Math.sin(s.angle) * dist;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1 - p;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', onClick);
      cancelAnimationFrame(raf);
    };
  }, [color, count, size, duration]);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  );
}
