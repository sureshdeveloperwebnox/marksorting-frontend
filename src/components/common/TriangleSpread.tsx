'use client';

import * as React from 'react';
import { gsap } from 'gsap';

interface TriangleSpreadProps {
  /** Number of triangle clones (default: 50) */
  count?: number;
  /** Stroke colour of the triangles (default: '#ddd') */
  strokeColor?: string;
  /** Base colour used by the dark vignette gradient overlay (default: '#1d1e22') */
  gradientColor?: string;
  /** Width / height of the SVG container (default: '100%') */
  size?: string | number;
  /** Loop the animation infinitely (default: true) */
  loop?: boolean;
  /** Extra className applied to the wrapper div */
  className?: string;
  /** Opacity of the gradient overlay (0-1, default: 0.7) */
  gradientOpacity?: number;
}

export function TriangleSpread({
  count = 50,
  strokeColor = '#ddd',
  gradientColor = '#1d1e22',
  size = '100%',
  loop = true,
  className = '',
  gradientOpacity = 0.7,
}: TriangleSpreadProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const groupRef = React.useRef<SVGGElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const tlRef = React.useRef<gsap.core.Tween | null>(null);

  React.useEffect(() => {
    const svg = svgRef.current;
    const g = groupRef.current;
    const originalPath = pathRef.current;
    if (!svg || !g || !originalPath) return;

    // ── Clone triangles ──────────────────────────────────────────────────────
    const clones: SVGPathElement[] = [];
    for (let i = 0; i < count; i++) {
      const clone = originalPath.cloneNode() as SVGPathElement;
      g.appendChild(clone);
      clones.push(clone);
    }

    // All paths (original + clones)
    const allPaths = g.querySelectorAll('path');

    // ── Spread timeline ──────────────────────────────────────────────────────
    const spread = gsap.timeline({ paused: true });

    spread
      .to(g, { svgOrigin: '5 5.5', rotate: -180, duration: 1 })
      .to(
        allPaths,
        {
          svgOrigin: '5 5.5',
          rotate: -180,
          scale: 0.15,
          attr: { 'stroke-width': 0 },
          ease: 'power1.in',
          stagger: { amount: 0.5, ease: 'sine.in' },
          duration: 1,
        },
        0
      );

    // ── Drive the spread timeline ────────────────────────────────────────────
    const driveTween = gsap.to(spread, {
      duration: 6,
      ease: 'power2.inOut',
      progress: 0.5,
      yoyo: loop,
      repeat: loop ? -1 : 0,
    });

    tlRef.current = driveTween;

    // ── Gradient rect rotation ───────────────────────────────────────────────
    const rect = svg.querySelector('rect');
    if (rect) {
      gsap.set(rect, { rotate: 45, svgOrigin: '5 5' });
    }

    // Reveal the SVG
    gsap.set(svg, { opacity: 1 });

    // ── Click to pause / resume ──────────────────────────────────────────────
    const handleClick = () => {
      if (!tlRef.current) return;
      const tl = tlRef.current;
      gsap.to(tl, { timeScale: tl.isActive() ? 0 : 1 });
    };
    svg.addEventListener('click', handleClick);

    return () => {
      svg.removeEventListener('click', handleClick);
      driveTween.kill();
      spread.kill();
      // Remove clones
      clones.forEach((c) => c.parentNode?.removeChild(c));
    };
  }, [count, loop]);

  // Convert gradientColor hex/rgb to rgba stops
  const toRgba = (base: string, alpha: number) => {
    // Support simple hex: #rrggbb
    if (base.startsWith('#') && base.length === 7) {
      const r = parseInt(base.slice(1, 3), 16);
      const g = parseInt(base.slice(3, 5), 16);
      const b = parseInt(base.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    // Fallback: return as-is with opacity appended
    return base;
  };

  const g0 = toRgba(gradientColor, 0.9 * gradientOpacity);
  const g1 = toRgba(gradientColor, 0);
  const g2 = toRgba(gradientColor, 0.5 * gradientOpacity);
  const g3 = toRgba(gradientColor, 0.8 * gradientOpacity);

  const gradId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`flex items-center justify-center pointer-events-auto ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 10 10"
        fill="none"
        overflow="visible"
        style={{ opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
      >
        <defs>
          <linearGradient id={gradId}>
            <stop offset="9%"  stopColor={g0} />
            <stop offset="30%" stopColor={g1} />
            <stop offset="68%" stopColor={g2} />
            <stop offset="91%" stopColor={g3} />
          </linearGradient>
        </defs>

        {/* Triangle group – clones are injected here by GSAP effect */}
        <g ref={groupRef}>
          <path
            ref={pathRef}
            stroke={strokeColor}
            strokeWidth="0.02"
            d="M5,1 9,8 1,8z"
          />
        </g>

        {/* Gradient overlay rect */}
        <rect fill={`url(#${gradId})`} width="11" height="11" />
      </svg>
    </div>
  );
}
