import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus, Car } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export interface Vehicle {
  id: string;
  plate: string; // Matrícula
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  vin?: string;
  kilometers: number;
  purchaseDate?: string;
  photoUrl?: string;
  notes?: string;
}

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
  initialData?: Vehicle | null;
}

const DEFAULT_FUELS = ['Gasóleo', 'Gasolina 95', 'Gasolina 98', 'Híbrido (Gasolina)', 'Híbrido (Gasóleo)', 'Elétrico', 'GPL'];

export function VehicleForm({ isOpen, onClose, onSave, initialData }: VehicleFormProps) {
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [fuelType, setFuelType] = useState('Gasóleo');
  const [vin, setVin] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [customFuels, setCustomFuels] = useState<string[]>([]);
  const [isAddingCustomFuel, setIsAddingCustomFuel] = useState(false);
  const [newCustomFuel, setNewCustomFuel] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('vehicle_custom_fuels');
    if (saved) {
      try {
        setCustomFuels(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom fuels', e);
      }
    }
  }, []);

  useEffect(() => {
    if (initialData) {
      setPlate(initialData.plate || '');
      setBrand(initialData.brand || '');
      setModel(initialData.model || '');
      setYear(initialData.year ? initialData.year.toString() : '');
      setFuelType(initialData.fuelType || 'Gasóleo');
      setVin(initialData.vin || '');
      setKilometers(initialData.kilometers ? initialData.kilometers.toString() : '');
      setPurchaseDate(initialData.purchaseDate || '');
      setPhotoUrl(initialData.photoUrl || '');
      setNotes(initialData.notes || '');
    } else {
      setPlate('');
      setBrand('');
      setModel('');
      setYear(new Date().getFullYear().toString());
      setFuelType('Gasóleo');
      setVin('');
      setKilometers('');
      setPurchaseDate('');
      setPhotoUrl('');
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const allFuels = [...DEFAULT_FUELS, ...customFuels];

  const handleFuelChange = (val: string) => {
    if (val === 'new_custom_fuel') {
      setIsAddingCustomFuel(true);
      setFuelType('');
    } else {
      setIsAddingCustomFuel(false);
      setFuelType(val);
    }
  };

  const handleAddCustomFuel = () => {
    if (newCustomFuel.trim() && !allFuels.includes(newCustomFuel.trim())) {
      const updated = [...customFuels, newCustomFuel.trim()];
      setCustomFuels(updated);
      localStorage.setItem('vehicle_custom_fuels', JSON.stringify(updated));
      setFuelType(newCustomFuel.trim());
      setNewCustomFuel('');
      setIsAddingCustomFuel(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleObj: Vehicle = {
      id: initialData ? initialData.id : Date.now().toString(),
      plate: plate.toUpperCase().trim(),
      brand: brand.trim(),
      model: model.trim(),
      year: parseInt(year) || new Date().getFullYear(),
      fuelType,
      vin: vin.trim(),
      kilometers: parseInt(kilometers) || 0,
      purchaseDate,
      photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60',
      notes: notes.trim()
    };
    onSave(vehicleObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-xl shadow-xl border-border my-8">
        <CardHeader className="relative pb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-xl flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            {initialData ? 'Editar Viatura' : 'Nova Viatura'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plate">Matrícula <span className="text-destructive">*</span></Label>
                <Input 
                  id="plate" 
                  placeholder="AA-00-AA" 
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="uppercase font-mono tracking-wider font-semibold"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Ano <span className="text-destructive">*</span></Label>
                <Input 
                  id="year" 
                  type="number"
                  placeholder="2020" 
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca <span className="text-destructive">*</span></Label>
                <Input 
                  id="brand" 
                  placeholder="Ex: BMW, Renault" 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo <span className="text-destructive">*</span></Label>
                <Input 
                  id="model" 
                  placeholder="Ex: Série 3, Clio" 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelType">Combustível <span className="text-destructive">*</span></Label>
                {!isAddingCustomFuel ? (
                  <Select value={fuelType} onValueChange={handleFuelChange} required>
                    <SelectTrigger id="fuelType">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allFuels.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                      <SelectItem value="new_custom_fuel">+ Personalizado...</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Novo combustível" 
                      value={newCustomFuel}
                      onChange={(e) => setNewCustomFuel(e.target.value)}
                      autoFocus
                    />
                    <Button type="button" onClick={handleAddCustomFuel} size="icon" className="shrink-0" disabled={!newCustomFuel.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setIsAddingCustomFuel(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="kilometers">Quilómetros Atuais (km) <span className="text-destructive">*</span></Label>
                <Input 
                  id="kilometers" 
                  type="number"
                  placeholder="125000" 
                  value={kilometers}
                  onChange={(e) => setKilometers(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vin">Número de Quadro (VIN)</Label>
                <Input 
                  id="vin" 
                  placeholder="WBA123456789..." 
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="font-mono text-xs uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Data de Compra</Label>
                <Input 
                  id="purchaseDate" 
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl">URL da Foto</Label>
              <Input 
                id="photoUrl" 
                placeholder="https://exemplo.com/foto.jpg"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas / Observações</Label>
              <Input 
                id="notes" 
                placeholder="Informações adicionais da viatura..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit">
                {initialData ? 'Atualizar Viatura' : 'Criar Viatura'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
