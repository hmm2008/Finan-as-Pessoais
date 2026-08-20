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
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Distribuição de Património</CardTitle>
        <Landmark className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={30}
                  paddingAngle={2}
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
            <div className="text-2xl font-bold truncate">
              {maskValue(total, formatter.format)}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              Maior fatia: {topCategory}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
