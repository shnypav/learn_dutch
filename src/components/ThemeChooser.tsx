import { useState, useRef, useEffect } from 'react';
import type { Theme } from '../types/theme';
import { themes } from '../types/theme';
import { useTheme } from '../contexts/ThemeContext';
import { CustomThemeDialog } from './CustomThemeDialog';

interface ThemeChooserProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  className?: string;
}

const ThemeChooser: React.FC<ThemeChooserProps> = ({
  currentTheme,
  onThemeChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const { customTheme, setCustomTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeOptions = [...Object.keys(themes), 'custom'] as Theme[];
  const currentThemeData = currentTheme === 'custom' ? customTheme : themes[currentTheme as keyof typeof themes];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeSelect = (theme: Theme) => {
    onThemeChange(theme);
    setIsOpen(false);
    if (theme === 'custom') {
      setTimeout(() => setShowCustomDialog(true), 100);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger - Same size as Stats button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          btn-primary px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium
          flex items-center space-x-2
        "
      >
        <span className="w-4 h-4 rounded-full border border-white/30" 
              style={{ background: currentTheme === 'custom' 
                ? `linear-gradient(135deg, ${customTheme.buttonBg}, ${customTheme.buttonHover})` 
                : currentThemeData.background.includes('gradient') 
                  ? currentThemeData.background 
                  : currentThemeData.buttonBg }}
        />
        <span>{currentThemeData.name}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="
          absolute top-full right-0 mt-4 w-48 z-50
          card-bg rounded-lg shadow-xl border border-opacity-20 border-white
          animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden
        ">
          <div className="py-1">
            {themeOptions.map((themeKey) => {
              const theme = themeKey === 'custom' ? customTheme : themes[themeKey as keyof typeof themes];
              const isActive = currentTheme === themeKey;

              return (
                <button
                  key={themeKey}
                  onClick={() => handleThemeSelect(themeKey)}
                  className="
                    w-full flex items-center space-x-3 px-4 py-2 text-left
                    transition-colors duration-150
                  "
                >
                  <span className="w-5 h-5 rounded-full border border-white/30 inline-block" 
                        style={{ background: themeKey === 'custom' 
                          ? `linear-gradient(135deg, ${customTheme.buttonBg}, ${customTheme.buttonHover})` 
                          : theme?.background?.includes('gradient') 
                            ? theme.background 
                            : theme?.buttonBg }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-primary">
                      {theme.name}
                    </div>
                    <div className="text-xs text-muted opacity-80">
                      {themeKey === 'default' ? 'Ocean vibes' : 
                       themeKey === 'duo' ? 'Gentle learning' :
                       themeKey === 'oled' ? 'Dark mode' :
                       themeKey === 'custom' ? 'Your colors' : 'Theme'}
                    </div>
                  </div>
                  {isActive && (
                    <svg className="w-4 h-4 text-primary opacity-90" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Configure button for custom theme */}
          {currentTheme === 'custom' && (
            <div className="border-t border-white/10 p-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCustomDialog(true);
                }}
                className="w-full px-3 py-1.5 text-sm text-primary hover:bg-white/10 rounded flex items-center justify-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>Configure Colors</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Custom Theme Dialog */}
      <CustomThemeDialog
        isOpen={showCustomDialog}
        onClose={() => setShowCustomDialog(false)}
        currentTheme={customTheme}
        onSave={setCustomTheme}
      />
    </div>
  );
};

export default ThemeChooser;