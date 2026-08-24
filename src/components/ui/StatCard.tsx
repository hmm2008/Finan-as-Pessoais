import * as React from "react";
import { Card, CardContent } from "./card";
import { TrendingUp, TrendingDown, EyeOff } from "lucide-react";
import { usePrivacy } from "../../contexts";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any; // Lucide icon
  iconColorClass?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
  isCurrency?: boolean;
}

export function StatCard({
  title,
  value,
  icon: IconComponent,
  iconColorClass = "text-primary bg-primary/10",
  trend,
  className,
  isCurrency = true,
}: StatCardProps) {
  const { privacyMode } = usePrivacy();

  const renderedValue = privacyMode && isCurrency ? "•••,•• €" : value;

  return (
    <Card className={className}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">{title}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-foreground">
              {renderedValue}
            </h3>
            {privacyMode && isCurrency && (
              <EyeOff className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
            )}
          </div>

          {trend && (
            <div className="flex items-center gap-1 mt-0.5">
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span className={`text-[11px] font-bold ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend.value}%
              </span>
              <span className="text-[10px] text-muted-foreground">vs mês anterior</span>
            </div>
          )}
        </div>

        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
          <IconComponent className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}
