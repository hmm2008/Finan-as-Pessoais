import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Plus, Car, Upload, Trash2, Image as ImageIcon, Link, Loader2, Camera } from 'lucide-react';
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

// Helper to resize and compress uploaded image files to optimize base64 storage
const compressAndReadFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o ficheiro de imagem.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem inválido.'));
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Convert to optimized JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

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

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

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
      setShowUrlInput(Boolean(initialData.photoUrl && !initialData.photoUrl.startsWith('data:')));
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
      setShowUrlInput(false);
    }
    setImageError(null);
    setIsProcessingImage(false);
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

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Por favor selecione um ficheiro de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    try {
      setIsProcessingImage(true);
      setImageError(null);
      const compressedDataUrl = await compressAndReadFile(file);
      setPhotoUrl(compressedDataUrl);
    } catch (err: any) {
      console.error('Error processing image:', err);
      setImageError(err?.message || 'Ocorreu um erro ao carregar a imagem.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // reset input so same file can be chosen again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setImageError(null);
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

            {/* Fotografia da Viatura (Upload do computador ou URL) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-1.5 font-semibold text-sm">
                  <Camera className="w-4 h-4 text-primary" />
                  Fotografia da Viatura
                </Label>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Link className="w-3 h-3" />
                  {showUrlInput ? 'Carregar do Computador' : 'Inserir URL de foto'}
                </button>
              </div>

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />

              {!showUrlInput ? (
                <div className="space-y-2">
                  {photoUrl ? (
                    <div className="relative rounded-lg border border-border bg-secondary/30 p-3 flex items-center gap-4">
                      <div className="w-20 h-20 rounded-md bg-secondary overflow-hidden shrink-0 border border-border relative">
                        <img 
                          src={photoUrl} 
                          alt="Foto da Viatura" 
                          className="w-full h-full object-cover"
                          onError={() => setImageError('Não foi possível carregar a pré-visualização da fotografia.')}
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          Fotografia Carregada
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {photoUrl.startsWith('data:') ? 'Imagem guardada na base de dados' : photoUrl}
                        </p>
                        <div className="flex gap-2 pt-1">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-7 text-xs"
                          >
                            <Upload className="w-3 h-3 mr-1" /> Alterar Foto
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleRemovePhoto}
                            className="h-7 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        isDragging 
                          ? 'border-primary bg-primary/10 scale-[0.99]' 
                          : 'border-border bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50'
                      }`}
                    >
                      {isProcessingImage ? (
                        <div className="flex flex-col items-center gap-2 text-primary py-2">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="text-xs font-medium">A otimizar e carregar fotografia...</span>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Clique para escolher uma fotografia do seu computador
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Ou arraste e largue o ficheiro aqui (PNG, JPG, WEBP)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input 
                    id="photoUrl" 
                    placeholder="https://exemplo.com/foto.jpg"
                    value={photoUrl}
                    onChange={(e) => {
                      setPhotoUrl(e.target.value);
                      setImageError(null);
                    }}
                  />
                  {photoUrl && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/30 p-2 rounded border border-border">
                      <span className="truncate flex-1 mr-2">{photoUrl}</span>
                      <button type="button" onClick={handleRemovePhoto} className="text-destructive hover:underline shrink-0">
                        Limpar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {imageError && (
                <p className="text-xs text-destructive font-medium">{imageError}</p>
              )}
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
              <Button type="submit" disabled={isProcessingImage}>
                {initialData ? 'Atualizar Viatura' : 'Criar Viatura'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

