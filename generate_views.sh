#!/bin/bash
VIEWS=(
  "WelcomeView"
  "DashboardView"
  "FinancasView"
  "ViaturasView"
  "PatrimonioView"
  "NotificacoesView"
  "OrcamentosView"
  "DespesasFixasView"
  "ReceitasFixasView"
  "ObjectivosView"
  "ConfiguracoesView"
  "LixeiraView"
  "ArquivoView"
  "RelatorioMensalImprimivelView"
  "PageNotFoundView"
)

for view in "${VIEWS[@]}"; do
  cat << FILE_EOF > "src/views/${view}.tsx"
import React from 'react';
import { PageHeader } from '../components/layout';

export default function ${view}() {
  return (
    <div>
      <PageHeader title="${view}" subtitle="Esta página está em construção." />
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-muted-foreground">Conteúdo da página ${view}</p>
      </div>
    </div>
  );
}
FILE_EOF
done
