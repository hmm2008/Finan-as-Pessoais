export interface UserPreferences {
  // Identity
  displayName: string;
  avatarUrl: string;

  // Custom Navigation Menu Labels
  navLabels: Record<string, string>;

  // Custom Page Titles & Subtitles
  pageTitles?: Record<string, string>;
  pageSubtitles?: Record<string, string>;

  // Layout & Density
  density: 'compact' | 'normal' | 'spaced';
  sidebarCollapsible: boolean;

  // Colors & Theme
  theme: 'light' | 'dark' | 'system';
  accentColor: string; // hex or CSS color e.g., '#10b981'

  // Typography
  fontFamily: 'inter' | 'system' | 'serif' | 'mono';
  baseFontSize: 'sm' | 'base' | 'lg';

  // Categorization Rules
  rules: CategorizationRule[];
}

export interface CategorizationRule {
  id: string;
  keyword: string;
  category: string;
  priority: number; // Higher number = higher priority
}

export interface UserPrefsCloudSyncService {
  getUserPrefs: (userId?: string) => Promise<UserPreferences>;
  saveUserPrefs: (prefs: Partial<UserPreferences>, userId?: string) => Promise<UserPreferences>;
  requestPinReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPin: (email: string, resetCode: string, newPin: string) => Promise<{ success: boolean; message: string }>;
}
