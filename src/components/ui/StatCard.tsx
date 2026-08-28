import * as React from "react";
import { Card, CardContent } from "./card";
import { TrendingUp, TrendingDown, EyeOff } from "lucide-react";
import { usePrivacy } from "../../contexts";
import { motion } from "motion/react";

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
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground tracking-[0.1em] truncate">{title}</p>
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate">
                {renderedValue}
              </h3>
              {privacyMode && isCurrency && (
                <EyeOff className="w-4 h-4 text-muted-foreground/60 animate-pulse shrink-0" />
              )}
            </div>

            {trend && (
              <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap overflow-hidden bg-secondary/30 w-fit px-2 py-0.5 rounded-full border border-border/50">
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-rose-500 shrink-0" />
                )}
                <span className={`text-[10px] sm:text-[11px] font-extrabold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {trend.value}%
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground/80 font-medium">vs anterior</span>
              </div>
            )}
          </div>

          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${iconColorClass}`}>
            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
