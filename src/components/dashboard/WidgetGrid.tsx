import React from 'react';

export function WidgetGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {children}
    </div>
  );
}
