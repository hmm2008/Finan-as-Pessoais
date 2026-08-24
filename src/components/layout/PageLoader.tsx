import React from 'react';

export function PageLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="mt-4 text-sm font-medium text-muted-foreground uppercase tracking-widest">A carregar...</p>
    </div>
  );
}
