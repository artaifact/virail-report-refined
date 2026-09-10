import React, { createContext, useContext, useState } from 'react';

interface SelectedReportContextType {
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;
}

const SelectedReportContext = createContext<SelectedReportContextType | null>(null);

export function SelectedReportProvider({ children }: { children: React.ReactNode }) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  return (
    <SelectedReportContext.Provider value={{ selectedReportId, setSelectedReportId }}>
      {children}
    </SelectedReportContext.Provider>
  );
}

export function useSelectedReport() {
  const ctx = useContext(SelectedReportContext);
  if (!ctx) throw new Error('useSelectedReport must be used within SelectedReportProvider');
  return ctx;
}
