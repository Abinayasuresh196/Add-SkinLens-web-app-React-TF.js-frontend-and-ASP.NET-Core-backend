import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Ranking from '../components/Ranking.jsx';
import CountUp from '../components/CountUp.jsx';
import { ArrowIcon, DownloadIcon, TrashIcon } from '../components/Icons.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { LOW_CONFIDENCE, riskOf } from '../lib/risk.js';
import { rankProbabilities } from '../lib/lesionTypes.js';
import { downloadScanReport } from '../lib/report.js';

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export default function ScanDetailPage() {
  const { id } = useParams();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.getScan(id).then(setScan).catch((e) => setError(e.message));
  }, [user, id]);

  if (ready && !user) return <Navigate to={`/sign-in?next=/history/${id}`} replace />;

  async function download() {
    setBusy('download');
    try {
      await downloadScanReport(scan);
    } catch (e) {
      setError(`Could not create the report: ${e.message}`);
    } finally {
      setBusy('');
    }
  }

  async function remove() {
    setBusy('delete');
    try {
      await api.deleteScan(id);
      navigate('/history', { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy('');
    }
  }

  const back = <Link to="/history" className="back-link"><span className="flip"><ArrowIcon /></span>Back to history</Link>;

  if (error && !scan) {
    return (
      <div className="container detail">
        {back}
        <p className="alert" role="alert">{error}</p>
      </div>
    );
  }
  if (!scan) {
    return (
      <div className="container detail">
        {back}
        <div className="detail-grid" aria-label="Loading scan">
          <div className="skeleton detail-skeleton" />
          <div className="skeleton detail-skeleton" />
        </div>
      </div>
    );
  }

  const ranked = rankProbabilities(scan.probabilities);
  const top = ranked[0];
  const risk = riskOf(top.risk);
  const when = new Date(scan.createdAt);

  return (
    <div className={`container detail tone-${risk.tone}`}>
      {back}

      <div className="detail-grid">
        <motion.aside
          className="detail-side"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="detail-photo">
            {scan.thumbnail ? <img src={scan.thumbnail} alt={`Saved image of the ${top.name.toLowerCase()} scan`} /> : <span>{top.code.toUpperCase()}</span>}
          </div>
          <dl className="detail-meta">
            <div><dt>Saved</dt><dd>{dateFmt.format(when)}, {timeFmt.format(when)}</dd></div>
            <div><dt>Body site</dt><dd>{scan.bodySite || '—'}</dd></div>
            <div><dt>Note</dt><dd>{scan.note || '—'}</dd></div>
            <div><dt>Model</dt><dd>{scan.modelVersion}</dd></div>
          </dl>
          <div className="detail-actions">
            <button type="button" className="btn btn-block" onClick={download} disabled={busy !== ''}>
              <DownloadIcon />{busy === 'download' ? 'Preparing PDF…' : 'Download report (PDF)'}
            </button>
            {confirming ? (
              <div className="confirm-row" role="group" aria-label="Confirm delete">
                <span>Delete this scan for good?</span>
                <button type="button" className="btn btn-small btn-danger" onClick={remove} disabled={busy !== ''}>
                  {busy === 'delete' ? 'Deleting…' : 'Delete'}
                </button>
                <button type="button" className="btn btn-small btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
              </div>
            ) : (
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirming(true)}>
                <TrashIcon />Delete scan
              </button>
            )}
          </div>
        </motion.aside>

        <motion.section
          className="detail-main panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="result">
            <div className="result-head">
              <div>
                <p className="result-kicker">Most likely</p>
                <h1 className="display result-name">{top.name}</h1>
                <span className="risk-pill"><span className="dot" aria-hidden="true" />{risk.label}</span>
              </div>
              <div className="confidence" aria-label={`Model confidence ${(scan.confidence * 100).toFixed(0)} percent`}>
                <span className="confidence-value"><CountUp value={scan.confidence * 100} />%</span>
                <span className="confidence-label">confidence</span>
              </div>
            </div>
            <p className="result-advice">{risk.advice}</p>
            {scan.confidence < LOW_CONFIDENCE && (
              <p className="note">The model was unsure about this image. Its top score was under 40%.</p>
            )}
            <h2 className="panel-title">All seven types</h2>
            <Ranking ranked={ranked} />
          </div>
          {error && <p className="alert" role="alert">{error}</p>}
          <p className="detail-disclaimer">Not a diagnosis. The model can miss skin cancers. See a dermatologist about any lesion that worries you.</p>
        </motion.section>
      </div>
    </div>
  );
}
