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
      <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2 overflow-hidden">
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase text-muted-foreground tracking-wider truncate">{title}</p>
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-base xs:text-lg sm:text-xl font-bold text-foreground truncate">
              {renderedValue}
            </h3>
            {privacyMode && isCurrency && (
              <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground animate-pulse shrink-0" />
            )}
          </div>

          {trend && (
            <div className="flex items-center gap-1 mt-0.5 whitespace-nowrap overflow-hidden">
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 shrink-0" />
              )}
              <span className={`text-[10px] sm:text-[11px] font-bold ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend.value}%
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate">vs mês ant.</span>
            </div>
          )}
        </div>

        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${iconColorClass}`}>
          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </CardContent>
    </Card>
  );
}
