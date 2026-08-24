import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { Button } from './button';

interface TooltipButtonProps {
  content: string;
  children: React.ReactNode;
}

export function TooltipButton({ content, children }: TooltipButtonProps) {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-lg z-50 text-center animate-in fade-in">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

interface InfoPopoverProps {
  content: string;
  className?: string;
}

export function InfoPopover({ content, className }: InfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 focus:outline-none"
        title="Ajuda"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 mt-1.5 w-56 p-3 rounded-xl border border-border bg-card shadow-lg z-50 text-[11px] text-muted-foreground leading-relaxed animate-in fade-in duration-100">
            {content}
          </div>
        </>
      )}
    </div>
  );
}
