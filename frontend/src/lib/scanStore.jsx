import { createContext, useContext, useMemo, useRef, useState } from 'react';

// Keeps the current scan (image + result) alive while the user visits other pages,
// e.g. signing in to save a result, then coming back.
const ScanContext = createContext(null);

export function ScanProvider({ children }) {
  const [imageUrl, setImageUrlState] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | analyzing | done
  const [result, setResult] = useState(null);
  const imageRef = useRef(null);

  const value = useMemo(() => ({
    imageUrl,
    phase,
    result,
    imageRef,
    setPhase,
    setResult,
    setImage(url, img) {
      setImageUrlState((old) => {
        if (old && old !== url) URL.revokeObjectURL(old);
        return url;
      });
      imageRef.current = img;
    },
    reset() {
      setImageUrlState((old) => { if (old) URL.revokeObjectURL(old); return null; });
      imageRef.current = null;
      setResult(null);
      setPhase('idle');
    },
  }), [imageUrl, phase, result]);

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export const useScan = () => useContext(ScanContext);
