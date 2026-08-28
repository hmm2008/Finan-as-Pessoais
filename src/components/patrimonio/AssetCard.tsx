import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Asset } from '../../types';
import { usePrivacy } from '../../contexts';
import { 
  Building2, TrendingUp, Edit, Trash2, AlertCircle, 
  MapPin, Calendar, ArrowUpRight, ArrowDownRight,
  ChevronRight, Landmark, PieChart, Coins
} from 'lucide-react';
import { addDays, isBefore, parseISO } from 'date-fns';
import { motion } from 'motion/react';

interface AssetCardProps {
  asset: any; 
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onSelectProperty?: (asset: Asset) => void;
  isSelectedProperty?: boolean;
}

export function AssetCard({
  asset,
  onEdit,
  onDelete,
  onSelectProperty,
  isSelectedProperty
}: AssetCardProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const purchaseVal = asset.purchaseValue || 0;
  const currentVal = asset.currentValue || 0;
  const gainAbs = currentVal - purchaseVal;
  const gainPct = purchaseVal > 0 ? (gainAbs / purchaseVal) * 100 : 0;
  const isPositive = gainAbs >= 0;

  // Check for alerts in property expenses
  const getAlerts = () => {
    if (!asset.expenses || !Array.isArray(asset.expenses)) return null;
    
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    
    let expired = 0;
    let warning = 0;

    asset.expenses.forEach((exp: any) => {
      if (exp.endDate) {
        const end = parseISO(exp.endDate);
        if (isBefore(end, today)) expired++;
        else if (isBefore(end, thirtyDaysFromNow)) warning++;
      }
      if (exp.dueDate) {
        const due = parseISO(exp.dueDate);
        if (isBefore(due, today)) expired++;
        else if (isBefore(due, thirtyDaysFromNow)) warning++;
      }
    });

    if (expired > 0) return { type: 'expired', count: expired, label: 'Expirado' };
    if (warning > 0) return { type: 'warning', count: warning, label: 'Atenção' };
    return null;
  };

  const alert = getAlerts();

  const formattedDate = asset.acquisitionDate || asset.startDate
    ? new Date(asset.acquisitionDate || asset.startDate || '').toLocaleDateString('pt-PT')
    : null;

  const fullAddress = [asset.street, asset.city].filter(Boolean).join(', ');

  const getIcon = () => {
    if (asset.category === 'imovel') return Building2;
    const subType = asset.subType?.toLowerCase() || '';
    if (subType.includes('ação') || subType.includes('stock') || subType.includes('etf')) return TrendingUp;
    if (subType.includes('cripto') || subType.includes('bitcoin')) return Coins;
    if (subType.includes('banco') || subType.includes('conta') || subType.includes('poupança')) return Landmark;
    return PieChart;
  };

  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full"
    >
      <Card 
        className={`group h-full overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm transition-all duration-500 cursor-pointer rounded-[2rem] flex flex-col ${
          isSelectedProperty 
            ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 border-transparent' 
            : 'hover:shadow-2xl hover:shadow-black/5 hover:border-blue-500/30'
        }`}
        onClick={() => {
          if (asset.category === 'imovel' && onSelectProperty) {
            onSelectProperty(asset);
          }
        }}
      >
        <CardContent className="p-0 flex-1 flex flex-col">
          {/* Visual Accent */}
          <div className={`h-1.5 w-full transition-colors duration-500 ${
            asset.category === 'imovel' 
              ? (isSelectedProperty ? 'bg-blue-600' : 'bg-blue-500/50 group-hover:bg-blue-500') 
              : 'bg-emerald-500/50 group-hover:bg-emerald-500'
          }`} />
          
          <div className="p-6 space-y-6 flex-1 flex flex-col">
            {/* Top row: Icon and Actions */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-105 shadow-sm ${
                  asset.category === 'imovel' 
                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' 
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-black text-lg text-foreground truncate tracking-tight leading-none">
                      {asset.name}
                    </h3>
                    {alert && (
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                        alert.type === 'expired' 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        <AlertCircle className="w-3 h-3" />
                        {alert.label}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
                    {asset.subType || (asset.category === 'imovel' ? 'Património Imobiliário' : 'Ativo Financeiro')}
                  </p>
                </div>
              </div>

              {/* Hover Actions */}
              <div className="flex items-center gap-1 shrink-0 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all"
                  onClick={() => onEdit(asset)}
                >
                  <Edit className="w-4.5 h-4.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
                  onClick={() => onDelete(asset)}
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </Button>
              </div>
            </div>

            {/* Value Highlights */}
            <div className="bg-muted/40 backdrop-blur-md rounded-[1.75rem] p-5 border border-border/10 shadow-inner flex flex-col justify-center">
              <div className="flex flex-col">
                <span className="text-[9px] text-muted-foreground/80 font-black uppercase tracking-[0.15em] mb-2">Valor Estimado</span>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-3xl font-black text-foreground tracking-tighter tabular-nums leading-none">
                    {maskValue(currentVal, formatter.format)}
                  </span>
                  {purchaseVal > 0 && (
                    <motion.div 
                      initial={false}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.5 }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm border ${
                        isPositive 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {gainPct.toFixed(1)}%
                    </motion.div>
                  )}
                </div>
              </div>

              {purchaseVal > 0 && (
                <div className="mt-4 pt-4 border-t border-border/10 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span className="opacity-70">Aquisição</span>
                  <span className="text-foreground/80">{maskValue(purchaseVal, formatter.format)}</span>
                </div>
              )}
            </div>

            {/* Context Info */}
            <div className="flex-1 space-y-3 px-1">
              {fullAddress && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground/80 font-semibold group-hover:text-foreground transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/5 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="truncate" title={fullAddress}>{fullAddress}</span>
                </div>
              )}

              {formattedDate && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground/80 font-semibold group-hover:text-foreground transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/5 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span>Desde {formattedDate}</span>
                </div>
              )}
              
              {asset.category === 'imovel' && (
                <div className="pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest transition-all group-hover:gap-2.5">
                    Gerir Ativo
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                  {asset.expenses && asset.expenses.length > 0 && (
                    <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border border-blue-500/10 shadow-sm">
                      {asset.expenses.length} encargos
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
