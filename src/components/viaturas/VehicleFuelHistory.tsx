import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Fuel, Plus, Trash2, Gauge, DollarSign } from 'lucide-react';
import { usePrivacy } from '../../contexts';

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  totalCost: number;
  pricePerLiter: number;
  kilometers: number;
  station?: string;
}

interface VehicleFuelHistoryProps {
  vehicleId: string;
  vehicleKm: number;
  fuelEntries: FuelEntry[];
  onAddFuelEntry: (entry: FuelEntry) => void;
  onDeleteFuelEntry: (id: string) => void;
}

export function VehicleFuelHistory({
  vehicleId,
  vehicleKm,
  fuelEntries,
  onAddFuelEntry,
  onDeleteFuelEntry
}: VehicleFuelHistoryProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [liters, setLiters] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [kilometers, setKilometers] = useState(vehicleKm ? vehicleKm.toString() : '');
  const [station, setStation] = useState('');

  // Sort entries by date desc
  const sortedEntries = [...fuelEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate consumption (L/100km) between consecutive entries if km available
  const getConsumptionForEntry = (index: number) => {
    const current = sortedEntries[index];
    const previous = sortedEntries[index + 1]; // Older entry
    if (previous && current.kilometers > previous.kilometers) {
      const distance = current.kilometers - previous.kilometers;
      if (distance > 0) {
        return ((current.liters / distance) * 100).toFixed(2);
      }
    }
    return null;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(liters) || 0;
    const c = parseFloat(totalCost) || 0;
    const km = parseInt(kilometers) || vehicleKm;
    const ppl = l > 0 ? c / l : 0;

    const newEntry: FuelEntry = {
      id: Date.now().toString(),
      vehicleId,
      date,
      liters: l,
      totalCost: c,
      pricePerLiter: parseFloat(ppl.toFixed(3)),
      kilometers: km,
      station: station.trim() || 'Posto de Combustível'
    };

    onAddFuelEntry(newEntry);
    setIsAdding(false);
    setLiters('');
    setTotalCost('');
    setStation('');
  };

  const totalFuelCost = sortedEntries.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalLiters = sortedEntries.reduce((acc, curr) => acc + curr.liters, 0);
  const avgPricePerLiter = totalLiters > 0 ? totalFuelCost / totalLiters : 0;

  return (
    <div className="space-y-6">
      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Total Gasto em Combustível</p>
              <p className="text-xl font-bold text-destructive mt-1">
                {maskValue(totalFuelCost, formatter.format)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Total de Litros</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {totalLiters.toFixed(1)} L
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Fuel className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Preço Médio / Litro</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {avgPricePerLiter > 0 ? `${avgPricePerLiter.toFixed(3)} €/L` : '—'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Fuel className="w-5 h-5 text-primary" /> Histórico de Abastecimentos
        </h3>
        <Button onClick={() => setIsAdding(!isAdding)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Registar Abastecimento
        </Button>
      </div>

      {/* Add Fuel Entry Inline Form */}
      {isAdding && (
        <Card className="border-primary/30 bg-primary/5 animate-in fade-in">
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <h4 className="font-semibold text-sm">Novo Registar de Combustível</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fuelDate" className="text-xs">Data</Label>
                  <Input 
                    id="fuelDate" 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fuelLiters" className="text-xs">Litros (L)</Label>
                  <Input 
                    id="fuelLiters" 
                    type="number" 
                    step="0.01"
                    placeholder="45.5" 
                    value={liters} 
                    onChange={(e) => setLiters(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fuelCost" className="text-xs">Custo Total (€)</Label>
                  <Input 
                    id="fuelCost" 
                    type="number" 
                    step="0.01"
                    placeholder="80.00" 
                    value={totalCost} 
                    onChange={(e) => setTotalCost(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fuelKm" className="text-xs">Quilómetros (km)</Label>
                  <Input 
                    id="fuelKm" 
                    type="number" 
                    placeholder="125500" 
                    value={kilometers} 
                    onChange={(e) => setKilometers(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Input 
                  placeholder="Posto (Ex: Galp A1, Repsol Solum)"
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className="max-w-xs"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>Cancelar</Button>
                  <Button type="submit" size="sm">Adicionar</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table / List of Entries */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/60 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3.5 pl-5">Data</th>
                <th className="p-3.5">Posto</th>
                <th className="p-3.5 text-right">Litros</th>
                <th className="p-3.5 text-right">Preço/L</th>
                <th className="p-3.5 text-right">Valor Total</th>
                <th className="p-3.5 text-right">Km Viatura</th>
                <th className="p-3.5 text-right">Média (L/100km)</th>
                <th className="p-3.5 text-center pr-5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Sem registos de abastecimento para esta viatura.
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry, idx) => {
                  const consumption = getConsumptionForEntry(idx);

                  return (
                    <tr key={entry.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3.5 pl-5 font-medium whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="p-3.5 text-muted-foreground">{entry.station || 'Posto de Combustível'}</td>
                      <td className="p-3.5 text-right font-medium">{entry.liters.toFixed(1)} L</td>
                      <td className="p-3.5 text-right text-muted-foreground">{entry.pricePerLiter.toFixed(3)} €</td>
                      <td className="p-3.5 text-right font-bold text-destructive">
                        {maskValue(entry.totalCost, formatter.format)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-xs">{(entry.kilometers ?? 0).toLocaleString()} km</td>
                      <td className="p-3.5 text-right">
                        {consumption ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                            {consumption} L/100km
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center pr-5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteFuelEntry(entry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
