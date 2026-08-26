import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { usePreferences } from '../../contexts/PreferencesContext';
import { 
  CheckCircle2, Monitor, Type, Layout, Plus, Trash2, 
  TrendingUp, Target, Car, Shield, Wallet, PiggyBank,
  PieChart, Activity, Lock, Globe, Home
} from 'lucide-react';

const ICON_OPTIONS = [
  { value: 'TrendingUp', icon: TrendingUp },
  { value: 'Target', icon: Target },
  { value: 'Car', icon: Car },
  { value: 'Shield', icon: Shield },
  { value: 'Wallet', icon: Wallet },
  { value: 'PiggyBank', icon: PiggyBank },
  { value: 'PieChart', icon: PieChart },
  { value: 'Activity', icon: Activity },
  { value: 'Lock', icon: Lock },
  { value: 'Globe', icon: Globe },
  { value: 'Home', icon: Home },
];

export function WelcomeScreenCustomizer() {
  const { prefs, updatePrefs } = usePreferences();
  const [success, setSuccess] = useState(false);
  
  const welcome = prefs.welcomeScreen || {
    title: 'O seu centro de comando financeiro.',
    subtitle: 'Tenha controlo absoluto sobre o seu dinheiro, património e objetivos familiares, num ambiente privado, seguro e encriptado.',
    features: []
  };

  const [localTitle, setLocalTitle] = useState(welcome.title);
  const [localSubtitle, setLocalSubtitle] = useState(welcome.subtitle);
  const [localFeatures, setLocalFeatures] = useState([...welcome.features]);

  const handleSave = () => {
    updatePrefs({
      welcomeScreen: {
        title: localTitle,
        subtitle: localSubtitle,
        features: localFeatures
      }
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const updated = [...localFeatures];
    updated[index] = { ...updated[index], [field]: value };
    setLocalFeatures(updated);
  };

  const addFeature = () => {
    if (localFeatures.length < 6) {
      setLocalFeatures([...localFeatures, { icon: 'Activity', title: 'Novo Destaque', description: 'Breve descrição do benefício.' }]);
    }
  };

  const removeFeature = (index: number) => {
    setLocalFeatures(localFeatures.filter((_, i) => i !== index));
  };

  return (
    <Card className="border border-border bg-card shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" /> Personalização do Ecrã de Boas-Vindas
            </CardTitle>
            <CardDescription>Configure os textos e destaques que aparecem antes do login</CardDescription>
          </div>
          <Button 
            size="sm" 
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90"
          >
            {success ? (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Guardado</>
            ) : (
              'Guardar Alterações'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {/* Main Text */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Type className="w-3.5 h-3.5" /> Título Principal
              </Label>
              <Input 
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Ex: O seu centro de comando financeiro."
                className="h-10 text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layout className="w-3.5 h-3.5" /> Subtítulo / Descrição
              </Label>
              <Textarea 
                value={localSubtitle}
                onChange={(e) => setLocalSubtitle(e.target.value)}
                placeholder="Ex: Tenha controlo absoluto sobre o seu dinheiro..."
                className="min-h-[100px] text-sm resize-none"
              />
            </div>
          </div>

          {/* Preview Placeholder */}
          <div className="bg-secondary/20 rounded-xl border border-border p-6 flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Pré-visualização Rápida</h4>
              <div className="space-y-2">
                <h3 className="text-lg font-bold leading-tight">{localTitle || 'Título em falta'}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">{localSubtitle || 'Subtítulo em falta'}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground italic">* Nota: As alterações serão guardadas na sua Drive para persistência.</p>
            </div>
          </div>
        </div>

        {/* Features Customizer */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold flex items-center gap-2">
                Destaques & Funcionalidades
              </h4>
              <p className="text-xs text-muted-foreground">Adicione até 6 destaques para o ecrã inicial</p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addFeature}
              disabled={localFeatures.length >= 6}
              className="h-8 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Destaque
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {localFeatures.map((feature, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border bg-card/50 space-y-4 relative group">
                <button 
                  onClick={() => removeFeature(idx)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex gap-4">
                  {/* Icon Selector */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Ícone</Label>
                    <div className="grid grid-cols-3 gap-1">
                      {ICON_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => updateFeature(idx, 'icon', opt.value)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            feature.icon === opt.value 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'bg-secondary/50 hover:bg-secondary text-muted-foreground'
                          }`}
                        >
                          <opt.icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Título</Label>
                      <Input 
                        value={feature.title}
                        onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Descrição</Label>
                      <Textarea 
                        value={feature.description}
                        onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                        className="min-h-[60px] text-[11px] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
