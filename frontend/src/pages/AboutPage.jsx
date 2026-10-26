import { motion, useReducedMotion } from 'framer-motion';
import { riskOf } from '../lib/risk.js';
import { LESION_TYPES as TYPES } from '../lib/lesionTypes.js';

const METRICS = [
  { label: 'Correct type', value: 0.765, text: 'of 1,441 test images were named correctly.' },
  { label: 'Balanced accuracy', value: 0.705, text: 'average hit rate when all seven types count equally.' },
  { label: 'Melanoma caught', value: 0.548, text: 'of melanomas were flagged. About 4 in 10 are missed.' },
  { label: 'Macro AUC', value: 0.935, text: 'how well it separates each type from the rest (1.0 is perfect).' },
];

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export default function AboutPage() {
  const reduce = useReducedMotion();
  const r = reduce ? {} : reveal;

  return (
    <div className="container about">
      <header className="about-head">
        <h1 className="display">About the model</h1>
        <p className="lede">
          An EfficientNetB3 image model fine-tuned on HAM10000, a public set of 10,015 dermoscopy images confirmed
          by dermatologists. It runs inside your browser with TensorFlow.js, so images are never uploaded.
        </p>
      </header>

      <motion.section className="about-section" {...r}>
        <h2 className="section-heading">Seven lesion types it recognises</h2>
        <div className="type-grid">
          {TYPES.map((t, i) => {
            const risk = riskOf(t.risk);
            return (
              <motion.article
                key={t.code}
                className={`type-card tone-${risk.tone}`}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <span className="risk-pill"><span className="dot" aria-hidden="true" />{risk.label}</span>
                <h3>{t.name}</h3>
                <p>{t.looks}</p>
              </motion.article>
            );
          })}
        </div>
      </motion.section>

      <motion.section className="about-section" {...r}>
        <h2 className="section-heading">How well it works on unseen images</h2>
        <div className="metric-grid">
          {METRICS.map((m, i) => (
            <div key={m.label} className="metric panel">
              <div className="metric-top">
                <span className="metric-label">{m.label}</span>
                <span className="metric-value">{m.label === 'Macro AUC' ? m.value.toFixed(3) : `${(m.value * 100).toFixed(1)}%`}</span>
              </div>
              <span className="metric-bar" aria-hidden="true">
                <motion.span
                  initial={{ width: reduce ? `${m.value * 100}%` : 0 }}
                  whileInView={{ width: `${m.value * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
              <p>{m.text}</p>
            </div>
          ))}
        </div>
        <p className="about-note">
          The training data has far more harmless moles than cancers, so the model applies a per-type correction
          that makes it more willing to flag rare and dangerous types. That raises false alarms but catches more cancers.
        </p>
      </motion.section>

      <motion.section className="about-section" {...r}>
        <h2 className="section-heading">What it cannot do</h2>
        <ul className="limits">
          <li><strong>It is not a diagnosis.</strong> Only a doctor, usually with a biopsy, can diagnose skin cancer.</li>
          <li><strong>Phone photos are unreliable.</strong> It was trained on dermoscopy images, which look very different.</li>
          <li><strong>It only knows seven types.</strong> Any other lesion will still be labelled as one of them.</li>
          <li><strong>Skin tone coverage is limited.</strong> HAM10000 is mostly lighter skin, so accuracy on darker skin is not well measured.</li>
        </ul>
      </motion.section>
    </div>
  );
}
