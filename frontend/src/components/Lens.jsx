import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { UploadIcon } from './Icons.jsx';

// Geometry (SVG units, viewBox 640 x 640)
const C = 320;
const R_LABEL = 303;
const R_SCORE = 276;
const R_LED = 243;
const R_BEZEL = 226;
const R_TICK_OUT = 214;
const R_TICK_IN = 205;
const LEDS = 16;
const TICKS = 120;
const SECTOR = 360 / 7;
const GAP = 7;

const polar = (r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const arc = (r, a0, a1) => {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

/**
 * The dermatoscope: LED ring, graticule bezel, glass with the image,
 * and an outer ring of 7 class scores that fills in after analysis.
 * `scores`: [{ code, probability, tone, isTop }] in model output order.
 */
export default function Lens({ imageUrl, phase, scores, disabled, onFile, prompt }) {
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);
  const [dragging, setDragging] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), 120); return () => clearTimeout(t); }, []);

  const analyzing = phase === 'analyzing';
  const done = phase === 'done' && scores;
  const take = (file) => { if (file && !disabled) onFile(file); };

  return (
    <div
      className={[
        'lens',
        on && 'is-on',
        imageUrl && 'has-image',
        analyzing && 'is-analyzing',
        done && 'is-done',
        dragging && 'is-dragging',
      ].filter(Boolean).join(' ')}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); take(e.dataTransfer.files?.[0]); }}
    >
      <div className="lens-halo" aria-hidden="true" />

      <svg className="lens-svg" viewBox="0 0 640 640" aria-hidden="true">
        <defs>
          <radialGradient id="bezelGrad" cx="50%" cy="35%" r="70%">
            <stop offset="0%" className="bezel-stop-a" />
            <stop offset="100%" className="bezel-stop-b" />
          </radialGradient>
        </defs>

        {/* Score ring: 7 sectors */}
        {Array.from({ length: 7 }, (_, i) => {
          const a0 = i * SECTOR + GAP / 2;
          const a1 = (i + 1) * SECTOR - GAP / 2;
          const s = scores?.[i];
          const mid = (a0 + a1) / 2;
          const [lx, ly] = polar(R_LABEL, mid);
          return (
            <g key={i} className={`sector${s?.isTop ? ' is-top' : ''}${s ? ` tone-${s.tone}` : ''}`}>
              <path d={arc(R_SCORE, a0, a1)} className="sector-track" />
              {done && (
                <motion.path
                  d={arc(R_SCORE, a0, a1)}
                  className="sector-fill"
                  initial={{ pathLength: reduce ? Math.max(s.probability, 0.012) : 0 }}
                  animate={{ pathLength: Math.max(s.probability, 0.012) }}
                  transition={{ duration: 1.1, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              {done && (
                <motion.text
                  x={lx} y={ly}
                  className="sector-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                >
                  {s.code} {(s.probability * 100).toFixed(0)}%
                </motion.text>
              )}
            </g>
          );
        })}

        {/* Bezel */}
        <circle cx={C} cy={C} r={R_BEZEL + 26} className="bezel-outer" />
        <circle cx={C} cy={C} r={R_BEZEL} className="bezel" fill="url(#bezelGrad)" />

        {/* LED ring */}
        {Array.from({ length: LEDS }, (_, i) => {
          const [x, y] = polar(R_LED, (i * 360) / LEDS);
          return <circle key={i} cx={x} cy={y} r="4.6" className="led" style={{ '--i': i }} />;
        })}

        {/* Graticule */}
        {Array.from({ length: TICKS }, (_, i) => {
          const deg = (i * 360) / TICKS;
          const major = i % 10 === 0;
          const [x0, y0] = polar(major ? R_TICK_IN - 5 : R_TICK_IN, deg);
          const [x1, y1] = polar(R_TICK_OUT, deg);
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} className={major ? 'tick major' : 'tick'} />;
        })}
      </svg>

      <div className="lens-glass">
        {imageUrl && (
          <motion.img
            key={imageUrl}
            src={imageUrl}
            alt="Your uploaded skin lesion"
            initial={reduce ? false : { scale: 1.25, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
        {analyzing && (
          <div className="scan-overlay" aria-hidden="true">
            <div className="scan-grid" />
            <div className="scan-line" />
          </div>
        )}
        <div className="glass-shine" aria-hidden="true" />
        <label className="lens-target">
          <input
            id="lens-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp"
            disabled={disabled}
            onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }}
          />
          <span className="lens-prompt">
            {!imageUrl && <UploadIcon />}
            <span>{prompt}</span>
          </span>
        </label>
      </div>
    </div>
  );
}
