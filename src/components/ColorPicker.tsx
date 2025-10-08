import React, { useState, useEffect } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  supportsGradient?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  label, 
  value, 
  onChange, 
  supportsGradient = false 
}) => {
  const [isGradient, setIsGradient] = useState(value.includes('gradient'));
  const [color1, setColor1] = useState('#667eea');
  const [color2, setColor2] = useState('#764ba2');

  // Parse the initial value once on mount and when value changes from parent
  useEffect(() => {
    if (value.includes('gradient')) {
      const matches = value.match(/#[0-9a-fA-F]{6}/g);
      if (matches && matches.length >= 2) {
        setColor1(matches[0]);
        setColor2(matches[1]);
      }
      setIsGradient(true);
    } else {
      if (value.startsWith('#')) {
        setColor1(value);
      }
      setIsGradient(false);
    }
  }, [value]);

  const handleColorChange = (newColor1: string, newColor2?: string, shouldBeGradient?: boolean) => {
    const gradientMode = shouldBeGradient !== undefined ? shouldBeGradient : isGradient;
    
    if (gradientMode && supportsGradient) {
      const c2 = newColor2 || color2;
      onChange(`linear-gradient(135deg, ${newColor1} 0%, ${c2} 100%)`);
    } else {
      onChange(newColor1);
    }
  };

  const toggleGradient = (checked: boolean) => {
    setIsGradient(checked);
    handleColorChange(color1, color2, checked);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {supportsGradient && (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isGradient}
              onChange={(e) => toggleGradient(e.target.checked)}
              className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">Gradient</span>
          </label>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {isGradient && supportsGradient ? (
          <>
            <div className="flex flex-col items-center space-y-1">
              <input
                type="color"
                value={color1}
                onChange={(e) => {
                  setColor1(e.target.value);
                  handleColorChange(e.target.value, color2);
                }}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">Start</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <input
                type="color"
                value={color2}
                onChange={(e) => {
                  setColor2(e.target.value);
                  handleColorChange(color1, e.target.value);
                }}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">End</span>
            </div>
          </>
        ) : (
          <input
            type="color"
            value={color1}
            onChange={(e) => {
              setColor1(e.target.value);
              handleColorChange(e.target.value);
            }}
            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
          />
        )}
        
        <div 
          className="flex-1 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
          style={{ 
            background: isGradient && supportsGradient 
              ? `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
              : color1 
          }}
        />
      </div>
    </div>
  );
};