import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { usePrivacy } from '../../contexts';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Landmark } from 'lucide-react';
import { useAssets, useVehicles } from '../../hooks/queries';

export function DashboardAssetDistribution() {
  const { maskValue, privacyMode } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const { assets } = useAssets();
  const { vehicles } = useVehicles();

  // Aggregate assets by type/category
  let checkingTotal = 0;
  let savingsTotal = 0;
  let investmentTotal = 0;
  let propertyTotal = 0;
  let otherTotal = 0;

  assets.forEach((asset: any) => {
    const val = Number(asset.balance || asset.currentValue || asset.value || 0);
    const type = asset.type || asset.category || '';
    if (type === 'checking' || type === 'ordem') {
      checkingTotal += val;
    } else if (type === 'savings' || type === 'poupanca') {
      savingsTotal += val;
    } else if (type === 'investment' || type === 'investimento' || type === 'financeiro') {
      investmentTotal += val;
    } else if (type === 'imovel' || type === 'property') {
      propertyTotal += val;
    } else {
      otherTotal += val;
    }
  });

  const vehiclesTotal = vehicles.reduce((acc: number, v: any) => acc + (Number(v.value) || 0), 0);

  const rawData = [
    { name: 'Contas à Ordem', value: checkingTotal, color: '#3b82f6' },
    { name: 'Poupanças', value: savingsTotal, color: '#10b981' },
    { name: 'Investimentos', value: investmentTotal, color: '#8b5cf6' },
    { name: 'Imóveis', value: propertyTotal, color: '#ec4899' },
    { name: 'Viaturas', value: vehiclesTotal, color: '#f59e0b' },
    { name: 'Outros Bens', value: otherTotal, color: '#6b7280' },
  ].filter(item => item.value > 0);

  // Fallback if no assets configured yet
  const data = rawData.length > 0 ? rawData : [{ name: 'Sem Património', value: 1, color: '#9ca3af' }];
  
  const total = data.reduce((acc, curr) => acc + (curr.name === 'Sem Património' ? 0 : curr.value), 0);
  const topCategory = [...data].sort((a, b) => b.value - a.value)[0]?.name || 'N/A';

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-2xl sm:rounded-3xl h-full flex flex-col hover:bg-card/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
        <CardTitle className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
          Distribuição de Património
        </CardTitle>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center">
            <Landmark className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center p-4 sm:p-6 pt-0 sm:pt-0">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 640 ? 20 : 30}
                  outerRadius={window.innerWidth < 640 ? 30 : 45}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {!privacyMode && <Tooltip formatter={(value: number) => formatter.format(value)} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg sm:text-3xl font-black text-foreground tracking-tighter tabular-nums truncate mb-0.5 sm:mb-1">
              {maskValue(total, formatter.format)}
            </div>
            <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 truncate">
              Top: {topCategory}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
