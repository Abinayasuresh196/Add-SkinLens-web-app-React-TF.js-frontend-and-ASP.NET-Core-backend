import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Lens from '../components/Lens.jsx';
import Ranking from '../components/Ranking.jsx';
import CountUp from '../components/CountUp.jsx';
import HomeSections from '../components/HomeSections.jsx';
import { ArrowIcon, CheckIcon, ShieldIcon, UploadIcon } from '../components/Icons.jsx';
import { classify, loadModel, makeThumbnail, MODEL_VERSION } from '../lib/model.js';
import { LOW_CONFIDENCE, riskOf } from '../lib/risk.js';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useScan } from '../lib/scanStore.jsx';

const MAX_BYTES = 15 * 1024 * 1024;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
const STEPS = ['Reading the image', 'Resizing to 300 × 300 pixels', 'Running EfficientNetB3', 'Calibrating the 7 class scores'];
const STEP_MS = 340;

const panelMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function ScanPage() {
  const { user } = useAuth();
  const { imageUrl, phase, result, imageRef, setImage, setPhase, setResult, reset } = useScan();
  const [model, setModel] = useState({ status: 'loading', progress: 0 });
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  useEffect(() => {
    let alive = true;
    loadModel((p) => alive && setModel({ status: 'loading', progress: p }))
      .then(() => alive && setModel({ status: 'ready', progress: 1 }))
      .catch((e) => alive && setModel({ status: 'error', progress: 0, message: e.message }));
    return () => { alive = false; };
  }, []);

  async function handleFile(file) {
    setError('');
    if (!OK_TYPES.includes(file.type)) {
      setError('Use a JPG, PNG, WEBP or BMP image. HEIC photos from iPhones need converting first.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('This image is larger than 15 MB. Use a smaller copy.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      URL.revokeObjectURL(url);
      setError('This file could not be opened as an image. Try a different file.');
      return;
    }

    setImage(url, img);
    setResult(null);
    setPhase('analyzing');
    setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length)), STEP_MS);
    try {
      // Let the analysing panel animate in before the model takes the GPU/main thread
      await new Promise((r) => setTimeout(r, 450));
      const [res] = await Promise.all([classify(img), new Promise((r) => setTimeout(r, STEP_MS * (STEPS.length + 0.6) - 450))]);
      setResult(res);
      setPhase('done');
    } catch (e) {
      setError(`The model could not analyse this image: ${e.message}`);
      setPhase('idle');
    } finally {
      clearInterval(timer);
    }
  }

  const ready = model.status === 'ready';
  const prompt = !ready
    ? model.status === 'error' ? 'Model unavailable' : `Loading model ${Math.round(model.progress * 100)}%`
    : phase === 'analyzing' ? 'Analysing' : imageUrl ? 'Choose another image' : 'Drop a dermoscopy image or click to browse';

  const scores = result
    ? result.ranked
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((c) => ({ code: c.code, probability: c.probability, tone: riskOf(c.risk).tone, isTop: c.code === result.top.code }))
    : null;

  return (
    <>
      <div className="scan container">
        <section className="scan-stage" aria-label="Image upload">
          <Lens
            imageUrl={imageUrl}
            phase={phase}
            scores={phase === 'done' ? scores : null}
            disabled={!ready || phase === 'analyzing'}
            onFile={handleFile}
            prompt={prompt}
          />
          {!ready && model.status !== 'error' && (
            <div className="load-bar" role="progressbar" aria-valuenow={Math.round(model.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Loading model">
              <span style={{ width: `${model.progress * 100}%` }} />
            </div>
          )}
          <p className="stage-hint">Dermoscopy images only. Your image is analysed on this device and never uploaded.</p>
          {model.status === 'error' && <p className="alert" role="alert">{model.message}</p>}
          {error && <p className="alert" role="alert">{error}</p>}
        </section>

        <section className="scan-panel" aria-live="polite">
          <AnimatePresence mode="wait">
            {phase === 'done' && result ? (
              <motion.div key="result" {...panelMotion}>
                <Result result={result} image={imageRef.current} user={user} onReset={() => { reset(); setError(''); }} />
              </motion.div>
            ) : phase === 'analyzing' ? (
              <motion.div key="analyzing" {...panelMotion}>
                <Analyzing step={step} />
              </motion.div>
            ) : (
              <motion.div key="intro" {...panelMotion}>
                <Intro ready={ready} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
      <HomeSections />
    </>
  );
}

function Intro({ ready }) {
  return (
    <div className="intro">
      <p className="eyebrow"><ShieldIcon />Private: analysed in your browser</p>
      <h1 className="display">Look closer at a <span className="grad-text">skin lesion</span>.</h1>
      <p className="lede">
        Place a dermoscopy image in the lens. SkinLens measures it against seven lesion types, from harmless moles
        to melanoma, and shows how likely each one is.
      </p>
      <div className="hero-actions">
        <label htmlFor="lens-file" className={`btn btn-lg${ready ? '' : ' is-disabled'}`} aria-disabled={!ready}>
          <UploadIcon />{ready ? 'Choose an image' : 'Loading model…'}
        </label>
        <Link to="/about" className="btn btn-ghost btn-lg">How it works <ArrowIcon /></Link>
      </div>
      <ol className="steps">
        <li><span className="step-num">1</span><span><strong>Add an image</strong> of a single lesion, sharp and close up.</span></li>
        <li><span className="step-num">2</span><span><strong>Read the scores</strong> for all seven types around the lens.</span></li>
        <li><span className="step-num">3</span><span><strong>Decide on a doctor visit</strong> with the result as a guide, not a diagnosis.</span></li>
      </ol>
      <dl className="specs">
        <div><dt>Model</dt><dd>EfficientNetB3</dd></div>
        <div><dt>Trained on</dt><dd>10,015 images</dd></div>
        <div><dt>Test accuracy</dt><dd>76.5%</dd></div>
      </dl>
    </div>
  );
}

function Analyzing({ step }) {
  const reduce = useReducedMotion();
  return (
    <div className="analyzing">
      <p className="eyebrow-live"><span className="pulse" aria-hidden="true" />Analysing</p>
      <h2 className="display-sm">Measuring the lesion against seven types</h2>
      <ul className="progress-steps">
        {STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : 'waiting';
          return (
            <motion.li
              key={s}
              className={`is-${state}`}
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <span className="progress-mark">{state === 'done' ? <CheckIcon /> : null}</span>
              {s}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

function Result({ result, image, user, onReset }) {
  const { top, ranked, adjusted } = result;
  const risk = riskOf(top.risk);
  const uncertain = top.probability < LOW_CONFIDENCE;

  return (
    <div className={`result tone-${risk.tone}`}>
      <div className="result-head">
        <div>
          <p className="result-kicker">Most likely</p>
          <h2 className="display result-name">{top.name}</h2>
          <span className="risk-pill"><span className="dot" aria-hidden="true" />{risk.label}</span>
        </div>
        <div className="confidence" aria-label={`Model confidence ${(top.probability * 100).toFixed(0)} percent`}>
          <span className="confidence-value"><CountUp value={top.probability * 100} />%</span>
          <span className="confidence-label">confidence</span>
        </div>
      </div>

      <p className="result-advice">{risk.advice}</p>
      {uncertain && (
        <p className="note">The model is unsure about this image. Its top score is under 40%. Try a sharper, closer dermoscopy image.</p>
      )}

      <h3 className="panel-title">All seven types</h3>
      <Ranking ranked={ranked} />

      <SaveForm top={top} adjusted={adjusted} image={image} user={user} />

      <button type="button" className="btn btn-ghost result-again" onClick={onReset}>Scan another image</button>
    </div>
  );
}

function SaveForm({ top, adjusted, image, user }) {
  const [bodySite, setBodySite] = useState('');
  const [note, setNote] = useState('');
  const [keepThumb, setKeepThumb] = useState(true);
  const [state, setState] = useState({ status: 'idle', message: '' });

  if (!user) {
    return (
      <div className="save-cta">
        <p>Sign in to keep this result and compare the lesion over time.</p>
        <Link className="btn" to="/sign-in?next=/">Sign in to save</Link>
      </div>
    );
  }

  if (state.status === 'saved') {
    return (
      <motion.div className="save-cta is-saved" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <p><CheckIcon /> Saved to your history.</p>
        <Link className="btn btn-ghost" to="/history">Open history</Link>
      </motion.div>
    );
  }

  async function save(e) {
    e.preventDefault();
    setState({ status: 'saving', message: '' });
    try {
      await api.saveScan({
        predictedCode: top.code,
        confidence: top.probability,
        probabilities: adjusted,
        thumbnail: keepThumb && image ? makeThumbnail(image) : null,
        bodySite,
        note,
        modelVersion: MODEL_VERSION,
      });
      setState({ status: 'saved', message: '' });
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }

  return (
    <form className="save" onSubmit={save}>
      <h3 className="panel-title">Save to history</h3>
      <div className="field-row">
        <label className="field">
          <span>Where on the body</span>
          <input value={bodySite} onChange={(e) => setBodySite(e.target.value)} maxLength={60} placeholder="Left forearm" />
        </label>
        <label className="field">
          <span>Note</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="First noticed in March" />
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={keepThumb} onChange={(e) => setKeepThumb(e.target.checked)} />
        <span>Keep a small thumbnail of the image with this result</span>
      </label>
      {state.status === 'error' && <p className="alert" role="alert">{state.message}</p>}
      <button className="btn" disabled={state.status === 'saving'}>{state.status === 'saving' ? 'Saving…' : 'Save to history'}</button>
    </form>
  );
}
