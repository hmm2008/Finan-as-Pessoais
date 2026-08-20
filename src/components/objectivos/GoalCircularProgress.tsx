import React from 'react';
import { usePrivacy } from '../../contexts';

interface GoalCircularProgressProps {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export function GoalCircularProgress({
  current,
  target,
  size = 120,
  strokeWidth = 10
}: GoalCircularProgressProps) {
  const { maskValue } = usePrivacy();
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let colorClass = 'stroke-primary';
  if (percentage >= 100) {
    colorClass = 'stroke-emerald-500';
  } else if (percentage >= 50) {
    colorClass = 'stroke-blue-500';
  } else {
    colorClass = 'stroke-amber-500';
  }

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-secondary"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${colorClass} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {/* Percentage Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        <span className="text-lg font-extrabold text-foreground leading-none">
          {percentage.toFixed(0)}%
        </span>
        <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
          atingido
        </span>
      </div>
    </div>
  );
}
