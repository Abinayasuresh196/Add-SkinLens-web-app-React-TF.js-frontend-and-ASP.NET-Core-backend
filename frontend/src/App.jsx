import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ScanPage from './pages/ScanPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import ScanDetailPage from './pages/ScanDetailPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import { BrandMark, HistoryIcon, InfoIcon, MoonIcon, ScanIcon, ShieldIcon, SunIcon } from './components/Icons.jsx';
import { useAuth } from './lib/auth.jsx';
import { useTheme } from './lib/theme.jsx';

const LINKS = [
  { to: '/', label: 'Scan', icon: ScanIcon, end: true },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/about', label: 'About the model', icon: InfoIcon },
];

export default function App() {
  const location = useLocation();
  const reduce = useReducedMotion();
  // A single saved scan is laid out to fit one screen (see .shell-fit)
  const fit = /^\/history\/[^/]+$/.test(location.pathname);

  return (
    <div className={`shell${fit ? ' shell-fit' : ''}`}>
      <a className="skip" href="#main">Skip to content</a>
      <div className="backdrop" aria-hidden="true" />
      <TopBar />

      <main id="main">
        {/* Jump to top while the old page is gone, so the new one fades in from the top */}
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
          <motion.div
            key={location.pathname}
            className="page"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Routes location={location}>
              <Route path="/" element={<ScanPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/history/:id" element={<ScanDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <p>SkinLens is an educational tool, not a medical device. It cannot diagnose skin cancer. See a dermatologist about any lesion that worries you, changes, bleeds or itches.</p>
        </div>
      </footer>
    </div>
  );
}

function TopBar() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);

  useEffect(() => setProfileOpen(false), [pathname]);

  return (
    <header className={`topbar${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="SkinLens home">
            <span className="brand-tile"><BrandMark size={26} /></span>
            <span className="brand-text">
              <span className="brand-name">Skin<span>Lens</span></span>
              <span className="brand-sub">AI lesion check</span>
            </span>
          </Link>

          <nav className="nav" aria-label="Main">
            {LINKS.map((l) => {
              const active = l.end ? pathname === l.to : pathname.startsWith(l.to);
              const Icon = l.icon;
              return (
                <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
                  {active && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                  <span className="nav-label"><Icon />{l.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="topbar-actions">
            <span className="privacy-chip" title="Images are analysed in your browser and never uploaded">
              <ShieldIcon />On-device
            </span>
            <button type="button" className="icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'grid' }}
                >
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </motion.span>
              </AnimatePresence>
            </button>
            <div className="profile-menu" ref={profileRef}>
              <button
                type="button"
                className="avatar-trigger"
                aria-label={user ? `Account: ${user.name}` : 'Account'}
                aria-expanded={profileOpen}
                aria-controls="profile-popover"
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="avatar" aria-hidden="true">{user?.name?.trim()?.[0]?.toUpperCase() || 'A'}</span>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.section
                    id="profile-popover"
                    className="profile-popover"
                    aria-label="Account details"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                  >
                    {user ? (
                      <>
                        <div className="profile-details">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                        <div className="profile-divider" />
                        <button
                          type="button"
                          className="profile-action"
                          onClick={() => {
                            signOut();
                            setProfileOpen(false);
                          }}
                        >
                          Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="profile-details">
                          <strong>Not signed in</strong>
                          <span>Sign in to view your saved scans and account.</span>
                        </div>
                        <Link to="/sign-in" className="btn btn-small btn-block" onClick={() => setProfileOpen(false)}>
                          Sign in
                        </Link>
                      </>
                    )}
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NotFound() {
  return (
    <div className="container page-narrow">
      <h1 className="display-sm">This page does not exist</h1>
      <p><Link to="/">Go to the scanner</Link></p>
    </div>
  );
}
