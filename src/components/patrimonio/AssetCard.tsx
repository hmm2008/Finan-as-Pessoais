import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Asset } from './types';
import { usePrivacy } from '../../contexts';
import { 
  Home, TrendingUp, Box, ArrowUpRight, ArrowDownRight, 
  MapPin, Building, Percent, Edit, Trash2, FileText, ChevronRight
} from 'lucide-react';

interface AssetCardProps {
  key?: any;
  asset: Asset;
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

  const getCategoryIcon = () => {
    switch (asset.category) {
      case 'imovel':
        return <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'financeiro':
        return <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Box className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <Card className={`transition-all ${
      isSelectedProperty ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-border/80'
    }`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-secondary shrink-0 mt-0.5">
              {getCategoryIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-base truncate">{asset.name}</h4>
                <span className="text-xs px-2 py-0.5 bg-secondary text-muted-foreground font-medium rounded-md">
                  {asset.subType}
                </span>
                {asset.institution && (
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary font-medium rounded-md flex items-center gap-1">
                    <Building className="w-3 h-3" /> {asset.institution}
                  </span>
                )}
              </div>

              {/* Sub-details depending on asset category */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                {asset.category === 'imovel' && (asset.city || asset.street) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    {[asset.street, asset.city].filter(Boolean).join(', ')}
                  </span>
                )}

                {asset.quantity && asset.averagePrice && (
                  <span>
                    {asset.quantity} un. @ {asset.averagePrice.toFixed(2)}€
                  </span>
                )}

                {asset.interestRate && (
                  <span className="flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <Percent className="w-3 h-3" /> TANB: {asset.interestRate}%
                  </span>
                )}

                {asset.acquisitionDate && (
                  <span>Adquirido em: {new Date(asset.acquisitionDate).toLocaleDateString('pt-PT')}</span>
                )}

                {asset.documentName && (
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <FileText className="w-3 h-3" /> {asset.documentName}
                  </span>
                )}
              </div>

              {asset.notes && (
                <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-1">{asset.notes}</p>
              )}
            </div>
          </div>

          {/* Right side metrics and controls */}
          <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
            <div className="text-left sm:text-right">
              <p className="text-xl font-bold text-foreground">
                {maskValue(asset.currentValue, formatter.format)}
              </p>
              <div className="flex items-center justify-start sm:justify-end gap-1.5 text-xs font-semibold mt-0.5">
                <span className="text-muted-foreground font-normal">
                  Compra: {maskValue(asset.purchaseValue, formatter.format)}
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded ${
                  isPositive 
                    ? 'text-emerald-600 bg-emerald-500/10' 
                    : 'text-destructive bg-destructive/10'
                }`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {isPositive ? '+' : ''}{gainPct.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {asset.category === 'imovel' && onSelectProperty && (
                <Button 
                  variant={isSelectedProperty ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => onSelectProperty(asset)}
                  className="text-xs shrink-0"
                >
                  Despesas <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(asset)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(asset)} title="Eliminar Ativo">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
