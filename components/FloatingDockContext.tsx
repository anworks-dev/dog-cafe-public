"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type FloatingDockContextValue = {
  /** True while a page-level FloatingActions is mounted. */
  claimed: boolean;
  claim: () => () => void;
};

const FloatingDockContext = createContext<FloatingDockContextValue | null>(null);

export function FloatingDockProvider({ children }: { children: ReactNode }) {
  const [claimCount, setClaimCount] = useState(0);

  const claim = useCallback(() => {
    setClaimCount((n) => n + 1);
    return () => setClaimCount((n) => Math.max(0, n - 1));
  }, []);

  const value = useMemo(
    () => ({ claimed: claimCount > 0, claim }),
    [claimCount, claim],
  );

  return (
    <FloatingDockContext.Provider value={value}>
      {children}
    </FloatingDockContext.Provider>
  );
}

/** Call from FloatingActions so the layout BackToTop hides. */
export function useClaimFloatingDock() {
  const ctx = useContext(FloatingDockContext);
  useEffect(() => {
    if (!ctx) return;
    return ctx.claim();
  }, [ctx]);
}

export function useFloatingDockClaimed() {
  return useContext(FloatingDockContext)?.claimed ?? false;
}
