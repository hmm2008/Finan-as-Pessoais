import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Asset } from './types';
import { usePrivacy } from '../../contexts';
import { motion } from 'motion/react';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface PatrimonioDistributionChartProps {
  assets: Asset[];
  activeTab: 'imovel' | 'financeiro';
}

const COLORS = [
  '#6366f1', // Indigo 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#ef4444', // Red 500
  '#8b5cf6', // Violet 500
  '#06b6d4', // Cyan 500
  '#ec4899', // Pink 500
];

export function PatrimonioDistributionChart({ assets, activeTab }: PatrimonioDistributionChartProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const filteredAssets = assets.filter(a => a.category === activeTab);

  if (filteredAssets.length === 0) {
    return null;
  }

  // Aggregate by subType or name
  const categoryMap: Record<string, number> = {};
  filteredAssets.forEach(a => {
    const key = a.subType || (a.category === 'imovel' ? 'Imóvel' : 'Ativo');
    categoryMap[key] = (categoryMap[key] || 0) + (a.currentValue || 0);
  });

  const pieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value
  }));

  const totalVal = pieData.reduce((sum, d) => sum + d.value, 0);

  // Bar data for "Valor por Tipo"
  const barData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    valor: value
  }));

  const formatShortEuros = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(0)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}k`;
    return `€${val}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Distribuição por Tipo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-3xl border-none shadow-sm bg-card/50 overflow-hidden h-full">
          <CardHeader className="p-6 bg-muted/20 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <PieIcon className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-black uppercase tracking-tight">Distribuição por Categoria</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                    animationBegin={200}
                    animationDuration={1200}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [maskValue(val, formatter.format), 'Valor']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(12px)',
                      borderColor: 'rgba(226, 232, 240, 0.5)',
                      borderRadius: '16px',
                      color: '#0f172a',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '12px'
                    }}
                    itemStyle={{ padding: '2px 0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Legend */}
            <div className="mt-4 pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-border/40">
              {pieData.map((item, index) => {
                const pct = totalVal > 0 ? (item.value / totalVal) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center gap-2.5">
                    <span 
                      className="w-3 h-3 rounded-md inline-block shadow-sm" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {item.name}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chart 2: Valor por Tipo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="rounded-3xl border-none shadow-sm bg-card/50 overflow-hidden h-full">
          <CardHeader className="p-6 bg-muted/20 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-black uppercase tracking-tight">Análise de Valor por Tipo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                  <XAxis 
                    type="number" 
                    tickFormatter={formatShortEuros} 
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    formatter={(val: number) => [maskValue(val, formatter.format), 'Valor']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(12px)',
                      borderColor: 'rgba(226, 232, 240, 0.5)',
                      borderRadius: '16px',
                      color: '#0f172a',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="valor" 
                    radius={[0, 12, 12, 0]} 
                    barSize={24}
                    animationDuration={1500}
                  >
                    {barData.map((_, index) => (
                      <Cell key={`cell-bar-${index}`} fill={COLORS[index % COLORS.length]} className="opacity-90 hover:opacity-100 transition-opacity" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
