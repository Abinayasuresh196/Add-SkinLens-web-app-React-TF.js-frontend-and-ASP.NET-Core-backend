import { motion, useReducedMotion } from 'framer-motion';
import { riskOf } from '../lib/risk.js';

/** All 7 lesion types, highest first, with animated bars. */
export default function Ranking({ ranked }) {
  const reduce = useReducedMotion();
  return (
    <ol className="ranking">
      {ranked.map((c, i) => {
        const tone = riskOf(c.risk).tone;
        return (
          <motion.li
            key={c.code}
            className={`tone-${tone}${i === 0 ? ' is-top' : ''}`}
            initial={reduce ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}
          >
            <span className="ranking-name">
              <span className="dot" aria-hidden="true" />
              {c.name}
            </span>
            <span className="ranking-bar" aria-hidden="true">
              <motion.span
                className="fill"
                initial={{ width: reduce ? `${Math.max(c.probability * 100, 1)}%` : 0 }}
                animate={{ width: `${Math.max(c.probability * 100, 1)}%` }}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            <span className="ranking-value">{(c.probability * 100).toFixed(1)}%</span>
          </motion.li>
        );
      })}
    </ol>
  );
}
