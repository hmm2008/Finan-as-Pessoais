import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  FileText, Calendar, Building2, Car, AlertTriangle, CheckCircle2, 
  Clock, ShieldAlert, Sparkles, Plus, ArrowUpRight, Calculator, Info,
  TrendingDown, Check, DollarSign, Bookmark, ExternalLink, Filter
} from 'lucide-react';
import { usePrivacy, usePreferences, useDashboard } from '../contexts';
import { useExpenses, useFixedExpenses, useIncomes, useAssets, useVehicles } from '../hooks/queries';

export default function AssistenteFiscalView() {
  const { maskValue } = usePrivacy();
  const { prefs } = usePreferences();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
  const { addExpense } = useExpenses();

  const customTitles = prefs.pageTitles || {};
  const customSubtitles = prefs.pageSubtitles || {};
  const pageTitle = customTitles['/fiscal'] || customTitles['/assistente-fiscal'] || 'Assistente Fiscal & Impostos';
  const pageSubtitle = customSubtitles['/fiscal'] || customSubtitles['/assistente-fiscal'] || 'Alertas de IMI, IUC, simulador de deduções de IRS e calendário da Autoridade Tributária';

  const { expenses } = useExpenses();
  const { fixedExpenses } = useFixedExpenses();
  const { incomes } = useIncomes();
  const { assets } = useAssets();
  const { vehicles } = useVehicles();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1 to 12

  // Filter expenses of current year for IRS calculations
  const yearExpenses = useMemo(() => {
    return expenses.filter((e: any) => {
      if (!e.date) return false;
      return e.date.startsWith(currentYear.toString());
    });
  }, [expenses, currentYear]);

  // Real estate assets for IMI calculation
  const properties = useMemo(() => {
    return assets.filter((a: any) => {
      const cat = (a.category || a.subType || '').toLowerCase();
      return cat.includes('imovel') || cat.includes('imóvel') || cat.includes('moradia') || cat.includes('apartamento') || cat.includes('terreno');
    });
  }, [assets]);

  // Total estimated VPT and IMI
  const imiEstimation = useMemo(() => {
    let totalVpt = 0;
    properties.forEach((p: any) => {
      totalVpt += Number(p.purchaseValue || p.currentValue || 0);
    });
    // Standard municipal rate average in Portugal ~ 0.35%
    const estimatedImi = totalVpt * 0.0035;
    
    // Installment logic according to AT rules:
    // <= 100€: 1 installment in May
    // > 100€ and <= 500€: 2 installments in May and November
    // > 500€: 3 installments in May, August and November
    let installments = 1;
    if (estimatedImi > 500) installments = 3;
    else if (estimatedImi > 100) installments = 2;

    const installmentAmount = estimatedImi / installments;

    return {
      totalVpt,
      estimatedImi,
      installments,
      installmentAmount
    };
  }, [properties]);

  // Vehicle IUC Calculation
  const vehicleIucAlerts = useMemo(() => {
    return vehicles.map((v: any) => {
      const plate = v.plate || v.matricula || '';
      const makeModel = `${v.make || v.marca || ''} ${v.model || v.modelo || ''}`.trim() || 'Viatura';
      const year = Number(v.year || v.ano || currentYear);
      
      // Default month or parse from notes/details
      let registrationMonth = 5; // Default May
      if (v.notes && v.notes.toLowerCase().includes('mês:')) {
        const parsedM = parseInt(v.notes.toLowerCase().split('mês:')[1], 10);
        if (!isNaN(parsedM) && parsedM >= 1 && parsedM <= 12) registrationMonth = parsedM;
      }

      const isCurrentMonth = registrationMonth === currentMonth;
      const isUpcoming = registrationMonth === currentMonth + 1 || (currentMonth === 12 && registrationMonth === 1);
      
      // Estimated IUC cost based on vehicle age approximation
      const estimatedIuc = year < 2007 ? 45.00 : 165.00;

      return {
        id: v.id,
        makeModel,
        plate,
        year,
        registrationMonth,
        isCurrentMonth,
        isUpcoming,
        estimatedIuc
      };
    });
  }, [vehicles, currentMonth, currentYear]);

  // IRS Deductions calculation from logged expenses
  const irsDeductions = useMemo(() => {
    let saude = 0;
    let educacao = 0;
    let habitacao = 0;
    let geralFamiliar = 0;
    let ivaSustentavel = 0;
    let ppr = 0;

    yearExpenses.forEach((e: any) => {
      const amt = Number(e.amount) || 0;
      const cat = (e.category || '').toLowerCase();

      if (cat.includes('saúde') || cat.includes('saude') || cat.includes('médico') || cat.includes('farmácia')) {
        saude += amt * 0.15;
      } else if (cat.includes('educação') || cat.includes('educacao') || cat.includes('escola') || cat.includes('propinas')) {
        educacao += amt * 0.30;
      } else if (cat.includes('habitação') || cat.includes('habitacao') || cat.includes('renda') || cat.includes('juros')) {
        habitacao += amt * 0.15;
      } else if (cat.includes('restaurante') || cat.includes('oficina') || cat.includes('veterinário') || cat.includes('passagem') || cat.includes('transportes')) {
        ivaSustentavel += amt * 0.05; // ~15% of VAT portion
      } else if (cat.includes('investimento') || cat.includes('ppr')) {
        ppr += amt * 0.20;
      } else {
        geralFamiliar += amt * 0.35;
      }
    });

    // Capped by IRS maximum legal limits in Portugal
    const cappedSaude = Math.min(saude, 1000);
    const cappedEducacao = Math.min(educacao, 800);
    const cappedHabitacao = Math.min(habitacao, 502);
    const cappedGeralFamiliar = Math.min(geralFamiliar, 250);
    const cappedIva = Math.min(ivaSustentavel, 250);
    const cappedPpr = Math.min(ppr, 400);

    const totalEstimatedDeduction = cappedSaude + cappedEducacao + cappedHabitacao + cappedGeralFamiliar + cappedIva + cappedPpr;

    return {
      saude: cappedSaude,
      educacao: cappedEducacao,
      habitacao: cappedHabitacao,
      geralFamiliar: cappedGeralFamiliar,
      ivaSustentavel: cappedIva,
      ppr: cappedPpr,
      totalEstimatedDeduction
    };
  }, [yearExpenses]);

  // Portuguese AT Official Calendar Events for current year
  const atCalendarEvents = [
    {
      id: 'cal_1',
      month: 1,
      monthLabel: 'Janeiro',
      deadline: `31 de Janeiro de ${currentYear}`,
      title: 'Agregado Familiar & Contratos de Arrendamento',
      desc: 'Comunicação das alterações ao agregado familiar e contratos de arrendamento de estudantes deslocados no Portal das Finanças.',
      status: currentMonth > 1 ? 'completed' : currentMonth === 1 ? 'urgent' : 'upcoming'
    },
    {
      id: 'cal_2',
      month: 2,
      monthLabel: 'Fevereiro',
      deadline: `25 de Fevereiro de ${currentYear}`,
      title: 'Validação de Faturas no e-fatura',
      desc: 'Prazo limite para verificar e associar setor de atividade às faturas pendentes no portal e-fatura.',
      status: currentMonth > 2 ? 'completed' : currentMonth === 2 ? 'urgent' : 'upcoming'
    },
    {
      id: 'cal_3',
      month: 3,
      monthLabel: 'Março',
      deadline: `15 a 31 de Março de ${currentYear}`,
      title: 'Consulta de Deduções e Consignação IRS',
      desc: 'Período para consultar despesas dedutíveis apuradas pela AT, reclamar valores e escolher a entidade para consignação de 0,5% do IRS.',
      status: currentMonth > 3 ? 'completed' : currentMonth === 3 ? 'urgent' : 'upcoming'
    },
    {
      id: 'cal_4',
      month: 4,
      monthLabel: 'Abril - Junho',
      deadline: `1 de Abril a 30 de Junho de ${currentYear}`,
      title: 'Entrega do IRS (Modelo 3)',
      desc: 'Submissão da declaração de rendimentos IRS referente ao ano anterior por todos os sujeitos passivos.',
      status: currentMonth >= 4 && currentMonth <= 6 ? 'urgent' : currentMonth > 6 ? 'completed' : 'upcoming'
    },
    {
      id: 'cal_5',
      month: 5,
      monthLabel: 'Maio',
      deadline: `31 de Maio de ${currentYear}`,
      title: 'IMI - 1ª Prestação ou Prestação Única',
      desc: 'Pagamento da 1ª prestação do IMI (ou prestação única caso o montante seja igual ou inferior a 100 €).',
      status: currentMonth > 5 ? 'completed' : currentMonth === 5 ? 'urgent' : 'upcoming'
    },
    {
      id: 'cal_6',
      month: 8,
      monthLabel: 'Agosto',
      deadline: `31 de Agosto de ${currentYear}`,
      title: 'IMI - 2ª Prestação (para montantes > 500 €)',
      desc: 'Pagamento da 2ª prestação do IMI para imóveis cujo imposto total exceda 500 €.',
      status: currentMonth > 8 ? 'completed' : currentMonth === 8 ? 'urgent' : 'upcoming'
    },
    {
      id: 'cal_7',
      month: 11,
      monthLabel: 'Novembro',
      deadline: `30 de Novembro de ${currentYear}`,
      title: 'IMI - 2ª Prestação (entre 100€ e 500€) ou 3ª Prestação (> 500€)',
      desc: 'Pagamento da prestação final do IMI no Portal das Finanças.',
      status: currentMonth > 11 ? 'completed' : currentMonth === 11 ? 'urgent' : 'upcoming'
    }
  ];

  // Quick Action to record IUC expense
  const [registeringExpenseId, setRegisteringExpenseId] = useState<string | null>(null);

  const handleCreateIucExpense = async (v: any) => {
    try {
      setRegisteringExpenseId(v.id);
      await addExpense({
        name: `IUC - ${v.makeModel} (${v.plate})`,
        description: `Imposto Único de Circulação - ${v.plate}`,
        date: new Date().toISOString().slice(0, 10),
        amount: v.estimatedIuc,
        category: 'Impostos',
        entity: 'Autoridade Tributária (AT)',
        method: 'MBWay',
        vehicle: true,
        notes: `Gerado via Assistente Fiscal em ${new Date().toLocaleDateString('pt-PT')}`
      });
      alert(`Despesa de IUC para ${v.makeModel} (${v.plate}) registada com sucesso!`);
    } catch (err) {
      alert('Erro ao registar despesa.');
    } finally {
      setRegisteringExpenseId(null);
    }
  };

  const handleCreateImiExpense = async (installmentIndex: number) => {
    try {
      setRegisteringExpenseId(`imi_${installmentIndex}`);
      await addExpense({
        name: `IMI - Prestação ${installmentIndex + 1}`,
        description: `Imposto Municipal sobre Imóveis - Prestação ${installmentIndex + 1}`,
        date: new Date().toISOString().slice(0, 10),
        amount: Math.round(imiEstimation.installmentAmount * 100) / 100,
        category: 'Habitação',
        entity: 'Autoridade Tributária (AT)',
        method: 'MBWay',
        notes: `Gerado via Assistente Fiscal IMI em ${new Date().toLocaleDateString('pt-PT')}`
      });
      alert(`Despesa de IMI (Prestação ${installmentIndex + 1}) registada com sucesso!`);
    } catch (err) {
      alert('Erro ao registar despesa de IMI.');
    } finally {
      setRegisteringExpenseId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title={pageTitle} subtitle={pageSubtitle}>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('https://portaldasfinancas.gov.pt', '_blank')}
            className="gap-2 text-xs font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Portal das Finanças
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('https://faturas.portaldasfinancas.gov.pt', '_blank')}
            className="gap-2 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> e-fatura
          </Button>
        </div>
      </PageHeader>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Estimated IRS Deductions */}
        <Card className="bg-card border-border shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">Deduções IRS Acumuladas ({currentYear})</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground">
              {maskValue(irsDeductions.totalEstimatedDeduction, formatter.format)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" /> Estimativa com base nos seus registos
            </p>
          </CardContent>
        </Card>

        {/* IMI Estimation */}
        <Card className="bg-card border-border shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">Estimativa IMI Anual</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground">
              {maskValue(imiEstimation.estimatedImi, formatter.format)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {properties.length} {properties.length === 1 ? 'imóvel registado' : 'imóveis registados'} ({imiEstimation.installments} {imiEstimation.installments === 1 ? 'prestação' : 'prestações'})
            </p>
          </CardContent>
        </Card>

        {/* IUC Estimation */}
        <Card className="bg-card border-border shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">Alertas de IUC (Viaturas)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-foreground">
              {vehicles.length} {vehicles.length === 1 ? 'Viatura' : 'Viaturas'}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pagar no mês da matrícula
            </p>
          </CardContent>
        </Card>

        {/* Next AT Deadline */}
        <Card className="bg-card border-border shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">Próxima Obrigação Fiscal</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-sm font-bold text-foreground truncate">
              {atCalendarEvents.find(e => e.status === 'urgent')?.title || atCalendarEvents.find(e => e.status === 'upcoming')?.title || 'Nenhuma pendente'}
            </p>
            <p className="text-[11px] text-primary mt-1 font-medium">
              {atCalendarEvents.find(e => e.status === 'urgent')?.deadline || 'Ver calendário completo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="simulador-irs" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-secondary/50 rounded-xl p-1 mb-6">
          <TabsTrigger value="simulador-irs" className="rounded-lg py-2 text-xs sm:text-sm font-medium">
            Simulador de IRS
          </TabsTrigger>
          <TabsTrigger value="imi-imoveis" className="rounded-lg py-2 text-xs sm:text-sm font-medium">
            Impostos de Imóveis (IMI)
          </TabsTrigger>
          <TabsTrigger value="iuc-viaturas" className="rounded-lg py-2 text-xs sm:text-sm font-medium">
            Imposto de Viaturas (IUC)
          </TabsTrigger>
          <TabsTrigger value="calendario-at" className="rounded-lg py-2 text-xs sm:text-sm font-medium">
            Calendário AT {currentYear}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Simulador de Deduções de IRS */}
        <TabsContent value="simulador-irs" className="space-y-6 mt-0 outline-none">
          <Card className="border border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-500" />
                    Simulador de Deduções à Coleta de IRS ({currentYear})
                  </CardTitle>
                  <CardDescription>
                    Estimativa das deduções fiscais calculadas automaticamente a partir dos movimentos registados na sua aplicação.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  Total: {maskValue(irsDeductions.totalEstimatedDeduction, formatter.format)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Despesas Gerais Familiares */}
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Despesas Gerais Familiares</span>
                    <span className="text-muted-foreground">35% (Max. 250 €)</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {maskValue(irsDeductions.geralFamiliar, formatter.format)}
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min((irsDeductions.geralFamiliar / 250) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Supermercado, vestuário, comunicações e bens de consumo.
                  </p>
                </div>

                {/* Saúde */}
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Saúde e Bem-Estar</span>
                    <span className="text-muted-foreground">15% (Max. 1.000 €)</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {maskValue(irsDeductions.saude, formatter.format)}
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min((irsDeductions.saude / 1000) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Consultas, medicação, seguro de saúde e óculos.
                  </p>
                </div>

                {/* Educação */}
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Educação e Formação</span>
                    <span className="text-muted-foreground">30% (Max. 800 €)</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {maskValue(irsDeductions.educacao, formatter.format)}
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((irsDeductions.educacao / 800) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Propinas, escolas, manuais escolares e explicações.
                  </p>
                </div>

                {/* Habitação */}
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Habitação & Rendas</span>
                    <span className="text-muted-foreground">15% (Max. 502 €)</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {maskValue(irsDeductions.habitacao, formatter.format)}
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min((irsDeductions.habitacao / 502) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Rendas de imóveis para habitação permanente.
                  </p>
                </div>

                {/* Exigência de Fatura (IVA) */}
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Incentivo à Exigência de Fatura (IVA)</span>
                    <span className="text-muted-foreground">15% IVA (Max. 250 €)</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {maskValue(irsDeductions.ivaSustentavel, formatter.format)}
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min((irsDeductions.ivaSustentavel / 250) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Restauração, hotelaria, oficinas auto, veterinários e passes.
                  </p>
                </div>

                {/* PPR */}
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>PPR (Planos Poupança Reforma)</span>
                    <span className="text-muted-foreground">20% (Max. 400 €)</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {maskValue(irsDeductions.ppr, formatter.format)}
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${Math.min((irsDeductions.ppr / 400) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Entradas em PPR até 31 de Dezembro do ano fiscal.
                  </p>
                </div>
              </div>

              {/* Tips for IRS Maximization */}
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-primary">Dica para Maximizar o Reembolso de IRS:</p>
                  <p className="text-muted-foreground">
                    Certifique-se de pedir NIF em todas as faturas durante o ano e aceder regularmente ao portal <strong>e-fatura</strong> para validar faturas pendentes antes de 25 de Fevereiro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Impostos de Imóveis (IMI) */}
        <TabsContent value="imi-imoveis" className="space-y-6 mt-0 outline-none">
          <Card className="border border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                Gestão e Alertas de IMI (Imposto Municipal sobre Imóveis)
              </CardTitle>
              <CardDescription>
                Calculado com base nos imóveis registados no seu Património.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {properties.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-semibold text-foreground">Nenhum imóvel registado no Património</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Adicione os seus imóveis no menu "Património" para calcular automaticamente a estimativa de IMI e os prazos de pagamento das prestações.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground">Valor Patrimonial Tributário (VPT) Estimado</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {maskValue(imiEstimation.totalVpt, formatter.format)}
                      </p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground">IMI Anual Estimado (Taxa Média 0.35%)</p>
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {maskValue(imiEstimation.estimatedImi, formatter.format)}
                      </p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground">Plano de Pagamento Autoridade Tributária</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {imiEstimation.installments} {imiEstimation.installments === 1 ? 'Prestação' : 'Prestações'}
                      </p>
                    </div>
                  </div>

                  {/* List of IMI Installments */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Prestações de IMI Agendadas ({currentYear}):</h4>
                    {Array.from({ length: imiEstimation.installments }).map((_, idx) => {
                      const monthName = idx === 0 ? 'Maio' : idx === 1 ? (imiEstimation.installments === 2 ? 'Novembro' : 'Agosto') : 'Novembro';
                      const deadline = idx === 0 ? `31 de Maio de ${currentYear}` : idx === 1 ? (imiEstimation.installments === 2 ? `30 de Novembro de ${currentYear}` : `31 de Agosto de ${currentYear}`) : `30 de Novembro de ${currentYear}`;
                      
                      return (
                        <div key={idx} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                              {idx + 1}ª
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">IMI - Prestação {idx + 1} ({monthName})</p>
                              <p className="text-xs text-muted-foreground">Prazo limite: {deadline}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                            <span className="text-lg font-black text-foreground">
                              {maskValue(imiEstimation.installmentAmount, formatter.format)}
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCreateImiExpense(idx)}
                              disabled={registeringExpenseId === `imi_${idx}`}
                              className="text-xs gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" /> Registar Despesa
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Imposto de Viaturas (IUC) */}
        <TabsContent value="iuc-viaturas" className="space-y-6 mt-0 outline-none">
          <Card className="border border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-500" />
                Alertas de IUC (Imposto Único de Circulação)
              </CardTitle>
              <CardDescription>
                O IUC deve ser pago anualmente até ao último dia do mês da matrícula de cada veículo.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {vehicleIucAlerts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl">
                  <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-semibold text-foreground">Nenhuma viatura registada</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Adicione os seus veículos no menu "Viaturas" para acompanhar automaticamente as datas do IUC e das inspeções.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleIucAlerts.map(v => (
                    <div key={v.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.isCurrentMonth ? 'bg-amber-500/10 text-amber-600' : 'bg-secondary text-foreground'}`}>
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground">{v.makeModel}</p>
                            <Badge variant="outline" className="font-mono text-[10px]">{v.plate}</Badge>
                            {v.isCurrentMonth && (
                              <Badge className="bg-amber-500 text-white text-[10px]">PAGAMENTO ESTE MÊS</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Mês de Matrícula: Mês {v.registrationMonth} • Ano: {v.year}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                        <span className="text-lg font-black text-foreground">
                          {maskValue(v.estimatedIuc, formatter.format)}
                        </span>
                        <Button 
                          size="sm" 
                          onClick={() => handleCreateIucExpense(v)}
                          disabled={registeringExpenseId === v.id}
                          className="text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          <Plus className="w-3.5 h-3.5" /> Registar IUC
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Calendário Oficial da AT */}
        <TabsContent value="calendario-at" className="space-y-6 mt-0 outline-none">
          <Card className="border border-border bg-card shadow-sm rounded-2xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Calendário Fiscal Oficial Autoridade Tributária ({currentYear})
              </CardTitle>
              <CardDescription>
                Prazos chave de obrigações tributárias para contribuintes individuais em Portugal.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {atCalendarEvents.map(evt => (
                  <div 
                    key={evt.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      evt.status === 'urgent' 
                        ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 ring-1 ring-amber-500/30' 
                        : evt.status === 'completed'
                        ? 'border-border/40 bg-secondary/10 opacity-70'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={
                            evt.status === 'urgent' 
                              ? 'bg-amber-500 text-white border-amber-500 font-bold' 
                              : evt.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : 'bg-primary/10 text-primary border-primary/30'
                          }
                        >
                          {evt.monthLabel}
                        </Badge>
                        <h4 className="text-sm font-bold text-foreground">{evt.title}</h4>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Prazo: {evt.deadline}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {evt.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
