"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface DashboardHeaderCrumb {
  label: string;
  href?: string;
}

interface HeaderBreadcrumbState {
  pathname: string;
  crumbs: DashboardHeaderCrumb[];
}

interface DashboardHeaderContextValue {
  breadcrumbs: HeaderBreadcrumbState | null;
  registerBreadcrumbs: (
    pathname: string,
    crumbs: DashboardHeaderCrumb[],
  ) => () => void;
  /**
   * DOM node a page can portal page-specific "always visible, never
   * scrolls" chrome into (a title/KPI row, a tab strip, ...) — rendered by
   * PageToolbarSlot as a sibling of <main>, so anything portaled here sits
   * outside <main>'s scroll entirely, exactly like the sidebar and this
   * header already do. Null until PageToolbarSlot mounts.
   */
  toolbarSlot: HTMLDivElement | null;
  setToolbarSlot: (node: HTMLDivElement | null) => void;
}

const DashboardHeaderContext = createContext<DashboardHeaderContextValue | null>(null);

export function DashboardHeaderProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<HeaderBreadcrumbState | null>(null);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);

  const registerBreadcrumbs = useCallback(
    (pathname: string, crumbs: DashboardHeaderCrumb[]) => {
      setBreadcrumbs({ pathname, crumbs });

      return () => {
        setBreadcrumbs((current) =>
          current?.pathname === pathname ? null : current,
        );
      };
    },
    [],
  );

  const value = useMemo(
    () => ({ breadcrumbs, registerBreadcrumbs, toolbarSlot, setToolbarSlot }),
    [breadcrumbs, registerBreadcrumbs, toolbarSlot],
  );

  return (
    <DashboardHeaderContext.Provider value={value}>
      {children}
    </DashboardHeaderContext.Provider>
  );
}

export function useDashboardHeader() {
  const context = useContext(DashboardHeaderContext);

  if (!context) {
    throw new Error("useDashboardHeader must be used within DashboardHeaderProvider");
  }

  return context;
}
