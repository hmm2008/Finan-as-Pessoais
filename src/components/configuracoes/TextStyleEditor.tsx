import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TextStyle } from '../../contexts/PreferencesContext';
import { Bold, Italic, Type, Palette, Maximize, RotateCcw } from 'lucide-react';

interface TextStyleEditorProps {
  label: string;
  style: TextStyle;
  onChange: (newStyle: TextStyle) => void;
  onReset?: () => void;
  defaultFont?: string;
}

const FONT_OPTIONS = [
  { label: 'Plus Jakarta Sans (Padrão)', value: 'Plus Jakarta Sans, sans-serif' },
  { label: 'Inter (Limpo)', value: 'Inter, sans-serif' },
  { label: 'Playfair Display (Elegante)', value: 'Playfair Display, serif' },
  { label: 'Lora (Clássico)', value: 'Lora, serif' },
  { label: 'Montserrat (Geométrico)', value: 'Montserrat, sans-serif' },
  { label: 'Poppins (Arredondado)', value: 'Poppins, sans-serif' },
  { label: 'Sistema', value: 'system-ui, sans-serif' },
];

const WEIGHT_OPTIONS = [
  { label: 'Normal', value: '400' },
  { label: 'Médio', value: '500' },
  { label: 'Semi-Negrito', value: '600' },
  { label: 'Negrito', value: '700' },
  { label: 'Extra-Negrito', value: '800' },
];

const SIZE_OPTIONS = [
  { label: 'Muito Pequeno', value: '0.75rem' },
  { label: 'Pequeno', value: '0.875rem' },
  { label: 'Normal', value: '1rem' },
  { label: 'Grande', value: '1.25rem' },
  { label: 'Muito Grande', value: '1.5rem' },
  { label: 'Extra Grande', value: '1.875rem' },
  { label: 'Display (H2)', value: '2.25rem' },
  { label: 'Hero (H1)', value: '3rem' },
];

export function TextStyleEditor({ label, style, onChange, onReset, defaultFont = 'Plus Jakarta Sans' }: TextStyleEditorProps) {
  const updateStyle = (field: keyof TextStyle, value: any) => {
    onChange({ ...style, [field]: value });
  };

  const hasChanges = Object.keys(style).some(key => style[key as keyof TextStyle] !== undefined);

  return (
    <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/10 relative group">
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-0.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-primary">{label}</Label>
          <p className="text-[9px] text-muted-foreground">Original: {defaultFont}</p>
        </div>
        {onReset && hasChanges && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="h-7 px-2 text-[10px] flex items-center gap-1 hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Repor definições de origem"
          >
            <RotateCcw className="w-3 h-3" /> Repor
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Font Family */}
        <div className="space-y-1.5">
          <Label className="text-[10px] flex items-center gap-1.5 text-muted-foreground">
            <Type className="w-3 h-3" /> Família de Letra
          </Label>
          <Select 
            value={style.fontFamily || ''} 
            onValueChange={(v) => updateStyle('fontFamily', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Escolher fonte..." />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map(f => (
                <SelectItem 
                  key={f.value} 
                  value={f.value} 
                  className="text-xs"
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-1.5">
          <Label className="text-[10px] flex items-center gap-1.5 text-muted-foreground">
            <Maximize className="w-3 h-3" /> Tamanho
          </Label>
          <Select 
            value={style.fontSize || ''} 
            onValueChange={(v) => updateStyle('fontSize', v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Escolher tamanho..." />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <Label className="text-[10px] flex items-center gap-1.5 text-muted-foreground">
            <Palette className="w-3 h-3" /> Cor do Texto
          </Label>
          <div className="flex gap-2">
            <Input 
              type="color" 
              value={style.color || '#000000'} 
              onChange={(e) => updateStyle('color', e.target.value)}
              className="w-10 h-8 p-1 rounded-md"
            />
            <Input 
              type="text" 
              value={style.color || ''} 
              onChange={(e) => updateStyle('color', e.target.value)}
              placeholder="#hex"
              className="h-8 text-xs flex-1"
            />
          </div>
        </div>

        {/* Style & Weight */}
        <div className="space-y-1.5">
          <Label className="text-[10px] flex items-center gap-1.5 text-muted-foreground">
            <Bold className="w-3 h-3" /> Peso e Aspeto
          </Label>
          <div className="flex gap-2">
            <Select 
              value={style.fontWeight || '400'} 
              onValueChange={(v) => updateStyle('fontWeight', v)}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Peso" />
              </SelectTrigger>
              <SelectContent>
                {WEIGHT_OPTIONS.map(w => (
                  <SelectItem key={w.value} value={w.value} className="text-xs">
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={style.italic ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStyle('italic', !style.italic)}
              className="h-8 w-8 p-0"
            >
              <Italic className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-2 p-3 rounded-lg border border-border bg-card">
        <p className="text-[10px] text-muted-foreground mb-1">Pré-visualização:</p>
        <p style={{
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color,
          fontStyle: style.italic ? 'italic' : 'normal'
        }} className="truncate">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </div>
    </div>
  );
}
