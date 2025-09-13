import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ThemeConfig, UserSettings } from '../types';
import { storageService, DEFAULT_SETTINGS } from '../services/storageService';

// Theme Context Types
interface ThemeContextType {
  theme: ThemeConfig;
  settings: UserSettings;
  updateTheme: (theme: Partial<ThemeConfig>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

// Theme Actions
type ThemeAction = 
  | { type: 'UPDATE_THEME'; payload: Partial<ThemeConfig> }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'RESET_SETTINGS' }
  | { type: 'LOAD_SETTINGS'; payload: UserSettings };

// Initial state
const initialState: UserSettings = DEFAULT_SETTINGS;

// Theme reducer
function themeReducer(state: UserSettings, action: ThemeAction): UserSettings {
  switch (action.type) {
    case 'UPDATE_THEME':
      return {
        ...state,
        theme: { ...state.theme, ...action.payload },
      };
    case 'UPDATE_SETTINGS':
      return { ...state, ...action.payload };
    case 'RESET_SETTINGS':
      return DEFAULT_SETTINGS;
    case 'LOAD_SETTINGS':
      return action.payload;
    default:
      return state;
  }
}

// Context creation
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider Props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme Provider Component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [settings, dispatch] = useReducer(themeReducer, initialState);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = storageService.getUserSettings();
    dispatch({ type: 'LOAD_SETTINGS', payload: savedSettings });
  }, []);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme mode
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme.mode);
    
    // Apply color scheme
    root.setAttribute('data-color-scheme', settings.theme.colorScheme);
    
    // Apply view mode
    root.setAttribute('data-view-mode', settings.theme.viewMode);
    
    // Apply font size
    root.setAttribute('data-font-size', settings.theme.fontSize);
    
    // Apply sidebar width
    root.style.setProperty('--sidebar-width', `${settings.theme.sidebarWidth}px`);
  }, [settings.theme]);

  const updateTheme = (themeUpdate: Partial<ThemeConfig>) => {
    dispatch({ type: 'UPDATE_THEME', payload: themeUpdate });
    storageService.updateThemeSettings(themeUpdate);
  };

  const updateSettings = (settingsUpdate: Partial<UserSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settingsUpdate });
    storageService.updateUserSettings(settingsUpdate);
  };

  const resetSettings = () => {
    dispatch({ type: 'RESET_SETTINGS' });
    storageService.updateUserSettings(DEFAULT_SETTINGS);
  };

  const value: ThemeContextType = {
    theme: settings.theme,
    settings,
    updateTheme,
    updateSettings,
    resetSettings,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility functions for theme application
export const getThemeClasses = (theme: ThemeConfig): string => {
  const classes = [
    `theme-${theme.mode}`,
    `scheme-${theme.colorScheme}`,
    `view-${theme.viewMode}`,
    `font-${theme.fontSize}`,
  ];
  return classes.join(' ');
};

export const getCSSVariables = (theme: ThemeConfig): React.CSSProperties => {
  return {
    '--sidebar-width': `${theme.sidebarWidth}px`,
    '--theme-mode': theme.mode,
    '--color-scheme': theme.colorScheme,
    '--view-mode': theme.viewMode,
    '--font-size': theme.fontSize,
  } as React.CSSProperties;
};