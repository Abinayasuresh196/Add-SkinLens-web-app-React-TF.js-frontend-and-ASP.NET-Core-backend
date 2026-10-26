const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const SunIcon = () => (
  <svg {...base}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const MoonIcon = () => (
  <svg {...base}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
);
export const UploadIcon = () => (
  <svg {...base} width="28" height="28"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
);
export const CheckIcon = () => (
  <svg {...base} width="16" height="16" strokeWidth="2.4"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const ScanIcon = () => (
  <svg {...base} width="16" height="16"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="3.2" /></svg>
);
export const HistoryIcon = () => (
  <svg {...base} width="16" height="16"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>
);
export const InfoIcon = () => (
  <svg {...base} width="16" height="16"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.01" /></svg>
);
export const ShieldIcon = () => (
  <svg {...base} width="16" height="16"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3Z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const ArrowIcon = () => (
  <svg {...base} width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const DownloadIcon = () => (
  <svg {...base} width="18" height="18"><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></svg>
);
export const ChevronIcon = () => (
  <svg {...base} width="18" height="18"><path d="M9 6l6 6-6 6" /></svg>
);
export const TrashIcon = () => (
  <svg {...base} width="18" height="18"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
);

export function BrandMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="brand-mark">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <circle key={i} cx={16 + 10 * Math.cos(a)} cy={16 + 10 * Math.sin(a)} r="1.4" className="brand-led" />;
      })}
      <circle cx="16" cy="16" r="4.5" className="brand-lesion" />
    </svg>
  );
}
