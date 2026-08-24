import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Vehicle } from './VehicleForm';
import { Car, Calendar, Fuel, Gauge, FileText, Edit, Tag, DollarSign } from 'lucide-react';
import { usePrivacy } from '../../contexts';

interface VehicleProfileProps {
  vehicle: Vehicle;
  onEdit: () => void;
  totalMaintenanceCost: number;
  totalFuelCost: number;
  costPerKm: number;
}

export function VehicleProfile({
  vehicle,
  onEdit,
  totalMaintenanceCost,
  totalFuelCost,
  costPerKm
}: VehicleProfileProps) {
  const { maskValue } = usePrivacy();
  const formatter = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Vehicle Image & Basic Card */}
        <Card className="md:col-span-1 border-border overflow-hidden">
          <div className="h-48 w-full bg-secondary relative overflow-hidden">
            <img 
              src={vehicle.photoUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60'} 
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60';
              }}
            />
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white font-mono font-bold px-3 py-1 rounded border border-white/20 tracking-wider">
              {vehicle.plate}
            </div>
          </div>
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold">{vehicle.brand} {vehicle.model}</h2>
              <p className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.fuelType}</p>
            </div>
            
            <Button onClick={onEdit} variant="outline" className="w-full">
              <Edit className="w-4 h-4 mr-2" /> Editar Dados da Viatura
            </Button>
          </CardContent>
        </Card>

        {/* Detailed Spec Sheet */}
        <Card className="md:col-span-2 border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" /> Ficha Técnica & Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-primary" /> Quilómetros
                </p>
                <p className="text-lg font-bold mt-1">{(vehicle.kilometers ?? 0).toLocaleString()} km</p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-primary" /> Combustível
                </p>
                <p className="text-lg font-bold mt-1">{vehicle.fuelType}</p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Ano de Fabrico
                </p>
                <p className="text-lg font-bold mt-1">{vehicle.year}</p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-destructive" /> Manutenção Acumulada
                </p>
                <p className="text-lg font-bold text-destructive mt-1">
                  {maskValue(totalMaintenanceCost, formatter.format)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-destructive" /> Combustível Acumulado
                </p>
                <p className="text-lg font-bold text-destructive mt-1">
                  {maskValue(totalFuelCost, formatter.format)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Custo por km
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {costPerKm > 0 ? `${costPerKm.toFixed(3)} €/km` : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Número de Quadro (VIN):</span>
                <span className="font-mono text-xs uppercase bg-secondary px-2 py-1 rounded">
                  {vehicle.vin || 'Não especificado'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Data de Aquisição:</span>
                <span>
                  {vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString('pt-PT') : 'Não especificada'}
                </span>
              </div>
              {vehicle.notes && (
                <div className="pt-2">
                  <span className="text-muted-foreground text-xs font-semibold uppercase block mb-1">Observações:</span>
                  <p className="text-sm bg-secondary/30 p-3 rounded border border-border">{vehicle.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
