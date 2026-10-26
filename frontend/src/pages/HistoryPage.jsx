import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { RISK } from '../lib/risk.js';
import { downloadScanReport } from '../lib/report.js';
import { ChevronIcon, DownloadIcon, ScanIcon, TrashIcon } from '../components/Icons.jsx';

const TONE_OF = { HighMalignant: 'high', Malignant: 'malignant', PreCancerous: 'pre', Benign: 'benign' };
const ORDER = ['high', 'malignant', 'pre', 'benign'];
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'flagged', label: 'See a doctor' },
  { key: 'benign', label: 'Usually harmless' },
];
const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export default function HistoryPage() {
  const { user, ready } = useAuth();
  const [scans, setScans] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmId, setConfirmId] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.listScans().then(setScans).catch((e) => setError(e.message));
  }, [user]);

  if (ready && !user) return <Navigate to="/sign-in?next=/history" replace />;

  async function remove(id) {
    try {
      await api.deleteScan(id);
      setScans((s) => s.filter((x) => x.id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function download(scan) {
    setDownloading(scan.id);
    try {
      await downloadScanReport(scan);
    } catch (e) {
      setError(`Could not create the report: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  }

  const toneOf = (s) => TONE_OF[s.risk] ?? 'benign';
  const counts = ORDER.map((t) => ({ tone: t, n: scans?.filter((s) => toneOf(s) === t).length ?? 0 }));
  const flagged = counts.filter((c) => c.tone !== 'benign').reduce((a, c) => a + c.n, 0);
  const filterCount = { all: scans?.length ?? 0, flagged, benign: (scans?.length ?? 0) - flagged };
  const visible = (scans ?? []).filter((s) =>
    filter === 'all' ? true : filter === 'flagged' ? toneOf(s) !== 'benign' : toneOf(s) === 'benign');

  return (
    <div className="container history">
      <header className="page-head">
        <div>
          <h1 className="display-sm">Scan history</h1>
          <p className="muted page-sub">Open any scan to see its full analysis again or download it as a PDF.</p>
        </div>
        <Link className="btn" to="/"><ScanIcon />New scan</Link>
      </header>

      {error && <p className="alert" role="alert">{error}</p>}
      {!scans && !error && <div className="skeleton-list" aria-label="Loading scans">{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>}

      {scans && scans.length === 0 && (
        <div className="panel empty">
          <h2>No saved scans yet</h2>
          <p>Scan a dermoscopy image and save the result to track the lesion here.</p>
          <Link className="btn" to="/">Scan an image</Link>
        </div>
      )}

      {scans && scans.length > 0 && (
        <>
          <section className="stat-row" aria-label="Summary">
            <div className="stat-card">
              <span className="stat-label">Saved scans</span>
              <span className="stat-value">{scans.length}</span>
            </div>
            <div className="stat-card tone-high">
              <span className="stat-label">Show a doctor</span>
              <span className="stat-value stat-tone">{flagged}</span>
            </div>
            <div className="stat-card tone-benign">
              <span className="stat-label">Usually harmless</span>
              <span className="stat-value stat-tone">{scans.length - flagged}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Last scan</span>
              <span className="stat-value stat-date">{dateFmt.format(new Date(scans[0].createdAt))}</span>
            </div>
          </section>

          <section className="panel summary">
            <div className="summary-bar" aria-hidden="true">
              {counts.filter((c) => c.n > 0).map((c) => (
                <motion.span
                  key={c.tone}
                  className={`tone-${c.tone}`}
                  initial={{ flexGrow: 0 }}
                  animate={{ flexGrow: c.n }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
            <ul className="summary-legend">
              {counts.map((c) => (
                <li key={c.tone} className={`tone-${c.tone}`}><span className="dot" aria-hidden="true" />{RISK[c.tone].label}: {c.n}</li>
              ))}
            </ul>
          </section>

          <div className="filter-row" role="group" aria-label="Filter scans">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`filter-chip${filter === f.key ? ' is-active' : ''}`}
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
              >
                {f.label}<span className="filter-count">{filterCount[f.key]}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 && <p className="muted empty-filter">No scans in this group.</p>}

          <ul className="scan-list">
            <AnimatePresence initial>
              {visible.map((s, i) => {
                const tone = toneOf(s);
                const when = new Date(s.createdAt);
                const label = `${s.predictedName} scan from ${dateFmt.format(when)}`;
                return (
                  <motion.li
                    key={s.id}
                    layout
                    className={`scan-row tone-${tone}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.05 } }}
                    exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                  >
                    <span className="thumb">
                      {s.thumbnail ? <img src={s.thumbnail} alt="" /> : <span aria-hidden="true">{s.predictedCode}</span>}
                    </span>
                    <span className="scan-row-main">
                      {/* Stretched link: the whole row opens the scan */}
                      <Link to={`/history/${s.id}`} className="scan-row-link" aria-label={`Open ${label}`}>{s.predictedName}</Link>
                      <span className="scan-row-risk"><span className="dot" aria-hidden="true" />{RISK[tone].label}</span>
                      {(s.bodySite || s.note) && <span className="muted">{[s.bodySite, s.note].filter(Boolean).join(' · ')}</span>}
                    </span>
                    <span className="scan-row-conf">
                      <span className="mini-bar" aria-hidden="true"><span style={{ width: `${s.confidence * 100}%` }} /></span>
                      {(s.confidence * 100).toFixed(0)}%
                    </span>
                    <time className="scan-row-date" dateTime={s.createdAt}>
                      {dateFmt.format(when)}<span>{timeFmt.format(when)}</span>
                    </time>
                    <span className="scan-row-actions">
                      {confirmId === s.id ? (
                        <>
                          <button type="button" className="btn btn-small btn-danger" onClick={() => remove(s.id)}>Delete</button>
                          <button type="button" className="btn btn-small btn-ghost" onClick={() => setConfirmId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="icon-btn" onClick={() => download(s)} disabled={downloading === s.id} aria-label={`Download PDF of ${label}`} title="Download PDF">
                            <DownloadIcon />
                          </button>
                          <button type="button" className="icon-btn icon-btn-danger" onClick={() => setConfirmId(s.id)} aria-label={`Delete ${label}`} title="Delete">
                            <TrashIcon />
                          </button>
                          <Link to={`/history/${s.id}`} className="scan-row-chevron" tabIndex={-1} aria-hidden="true" title="Open scan">
                            <ChevronIcon />
                          </Link>
                        </>
                      )}
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </>
      )}
    </div>
  );
}
