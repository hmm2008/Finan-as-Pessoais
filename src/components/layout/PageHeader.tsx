import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { usePreferences, textStyleToCSS } from '../../contexts/PreferencesContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  showBack?: boolean;
  pageKey?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, children, showBack = false, pageKey, className = "" }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { prefs } = usePreferences();

  const key = pageKey || location.pathname;
  const customTitles = prefs.pageTitles || {};
  const customSubtitles = prefs.pageSubtitles || {};

  const effectiveTitle = customTitles[key] || title;
  const effectiveSubtitle = customSubtitles[key] !== undefined ? customSubtitles[key] : subtitle;

  const { backgroundColor: _headerBg, ...headerTextStyle } = prefs.customStyles?.pageTitles || {};
  const hasBg = !!_headerBg && _headerBg !== 'transparent' && _headerBg !== '#f8fafc00';

  return (
    <div 
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className} ${hasBg ? 'p-4 sm:p-6 rounded-2xl border border-border/40 shadow-sm' : ''}`}
      style={{ backgroundColor: _headerBg }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 
            className="text-xl sm:text-2xl font-bold tracking-tight text-foreground"
            style={textStyleToCSS(headerTextStyle)}
          >
            {effectiveTitle}
          </h1>
          {effectiveSubtitle && (
            <p className="text-sm text-muted-foreground mt-1">{effectiveSubtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
