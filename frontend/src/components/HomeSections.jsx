import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowIcon, ScanIcon, ShieldIcon, UploadIcon } from './Icons.jsx';
import { LESION_TYPES } from '../lib/lesionTypes.js';
import { riskOf } from '../lib/risk.js';

const FEATURES = [
  { icon: ShieldIcon, title: 'Private by design', text: 'The model runs in your browser. Your image never leaves this device unless you choose to save a result.' },
  { icon: ScanIcon, title: 'All seven scores', text: 'See how likely every lesion type is, not just the top guess, so you know when the model is unsure.' },
  { icon: UploadIcon, title: 'Results in seconds', text: 'No queue and no sign-up needed. Drop an image in the lens and the scores appear almost at once.' },
];

// The ABCDE rule dermatologists use to spot a mole that needs checking
const ABCDE = [
  { letter: 'A', title: 'Asymmetry', text: 'One half does not match the other.' },
  { letter: 'B', title: 'Border', text: 'Edges are ragged, notched or blurred.' },
  { letter: 'C', title: 'Colour', text: 'Several shades of brown, black, red, white or blue.' },
  { letter: 'D', title: 'Diameter', text: 'Larger than 6 mm, about the size of a pencil eraser.' },
  { letter: 'E', title: 'Evolving', text: 'Changing in size, shape or colour, or starting to bleed or itch.' },
];

const TIPS = [
  { title: 'Use a dermoscopy image', text: 'The model was trained on dermatoscope photos. Normal phone photos give unreliable scores.' },
  { title: 'One lesion, centred', text: 'Crop so a single spot fills most of the frame, with a little normal skin around it.' },
  { title: 'Sharp and well lit', text: 'Avoid blur, glare and shadows. Even lighting shows the true colours of the lesion.' },
  { title: 'No hair or markings', text: 'Hair, ink marks and rulers over the lesion can confuse the model.' },
];

const FAQ = [
  { q: 'Can SkinLens tell me if I have skin cancer?', a: 'No. It is an educational tool that shows how an image model scores a lesion. Only a doctor, usually with a biopsy, can diagnose skin cancer.' },
  { q: 'Is my image uploaded anywhere?', a: 'No. The analysis runs entirely in your browser. If you sign in and save a result, only the scores, your notes and an optional small thumbnail are stored.' },
  { q: 'How accurate is it?', a: 'It named the correct type for 91.5% of unseen test images, and flagged about 55% of melanomas. That means it misses some cancers, so never use it to rule one out.' },
  { q: 'Why does it work poorly on phone photos?', a: 'It learned from dermoscopy images, which are magnified and evenly lit. Ordinary photos look very different to the model.' },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export default function HomeSections() {
  const reduce = useReducedMotion();
  const r = reduce ? {} : reveal;

  return (
    <div className="home-sections">
      <motion.section className="container home-section" {...r} aria-labelledby="features-title">
        <SectionHead id="features-title" kicker="Why SkinLens" title="A closer look, without giving anything away" />
        <div className="feature-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <article key={f.title} className="feature-card">
                <span className="feature-icon"><Icon /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            );
          })}
        </div>
      </motion.section>

      <motion.section className="container home-section" {...r} aria-labelledby="types-title">
        <TypeCarousel />
      </motion.section>

      <motion.section className="container home-section" {...r} aria-labelledby="abcde-title">
        <SectionHead id="abcde-title" kicker="Warning signs" title="The ABCDE rule for moles">
          <p className="section-aside">If a spot shows any of these, show it to a doctor, whatever the scan says.</p>
        </SectionHead>
        <ul className="abcde-grid">
          {ABCDE.map((s) => (
            <li key={s.letter} className="abcde-card">
              <span className="abcde-letter" aria-hidden="true">{s.letter}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section className="container home-section" {...r} aria-labelledby="tips-title">
        <SectionHead id="tips-title" kicker="Before you scan" title="Get a more reliable result" />
        <ol className="tip-grid">
          {TIPS.map((t, i) => (
            <li key={t.title} className="tip-card">
              <span className="tip-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </li>
          ))}
        </ol>
      </motion.section>

      <motion.section className="container home-section" {...r} aria-labelledby="faq-title">
        <SectionHead id="faq-title" kicker="Questions" title="Good to know" />
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>{f.q}<span className="faq-plus" aria-hidden="true" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </motion.section>

      <motion.section className="container home-section" {...r}>
        <div className="cta-band">
          <div>
            <h2>Ready to look closer?</h2>
            <p>Add a dermoscopy image and see all seven scores in seconds.</p>
          </div>
          <div className="cta-actions">
            <button type="button" className="btn btn-lg btn-light" onClick={() => window.scrollTo({ top: 0 })}>
              <UploadIcon />Start a scan
            </button>
            <Link to="/about" className="btn btn-lg btn-outline-light">About the model <ArrowIcon /></Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function SectionHead({ id, kicker, title, children }) {
  return (
    <div className="section-head">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h2 id={id} className="section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// Horizontally scrolling, snap-aligned row of lesion type cards with arrow controls
function TypeCarousel() {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = trackRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const scroll = (dir) => {
    const el = trackRef.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <>
      <SectionHead id="types-title" kicker="What it looks for" title="Seven lesion types">
        <div className="carousel-controls">
          <button type="button" className="icon-btn" onClick={() => scroll(-1)} disabled={edges.start} aria-label="Previous types">
            <span className="flip"><ArrowIcon /></span>
          </button>
          <button type="button" className="icon-btn" onClick={() => scroll(1)} disabled={edges.end} aria-label="Next types">
            <ArrowIcon />
          </button>
        </div>
      </SectionHead>
      <div className="carousel" ref={trackRef} onScroll={update} tabIndex={0} aria-label="Lesion types, scroll sideways">
        {LESION_TYPES.map((t) => {
          const risk = riskOf(t.risk);
          return (
            <article key={t.code} className={`type-slide tone-${risk.tone}`}>
              <span className="type-code">{t.code.toUpperCase()}</span>
              <span className="risk-pill"><span className="dot" aria-hidden="true" />{risk.label}</span>
              <h3>{t.name}</h3>
              <p>{t.looks}</p>
            </article>
          );
        })}
      </div>
    </>
  );
}
