import React, { createContext, useContext, useState, useCallback } from 'react';

interface DashboardContextType {
  currentMonth: string; // YYYY-MM format
  setMonth: (month: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  isLoading?: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const currentDate = new Date();
  const initialMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [currentMonth, setMonth] = useState(initialMonth);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <DashboardContext.Provider value={{ currentMonth, setMonth, refreshKey, triggerRefresh, isLoading: false }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
