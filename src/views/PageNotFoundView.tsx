import React from 'react';
import { PageHeader } from '../components/layout';

export default function PageNotFoundView() {
  return (
    <div>
      <PageHeader title="PageNotFoundView" subtitle="Esta página está em construção." />
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-muted-foreground">Conteúdo da página PageNotFoundView</p>
      </div>
    </div>
  );
}
