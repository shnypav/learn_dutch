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
  const [solidColor, setSolidColor] = useState('#667eea');

  useEffect(() => {
    if (value.includes('gradient')) {
      const matches = value.match(/#[0-9a-fA-F]{6}/g);
      if (matches && matches.length >= 2) {
        setColor1(matches[0]);
        setColor2(matches[1]);
      }
      setIsGradient(true);
    } else if (value.startsWith('#')) {
      setSolidColor(value);
      setIsGradient(false);
    } else if (value.includes('rgba')) {
      // Convert rgba to hex for the picker
      const rgbaMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbaMatch) {
        const hex = '#' + 
          parseInt(rgbaMatch[1]).toString(16).padStart(2, '0') +
          parseInt(rgbaMatch[2]).toString(16).padStart(2, '0') +
          parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
        setSolidColor(hex);
      }
      setIsGradient(false);
    }
  }, [value]);

  const handleColorChange = () => {
    if (isGradient && supportsGradient) {
      onChange(`linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`);
    } else {
      onChange(solidColor);
    }
  };

  useEffect(() => {
    handleColorChange();
  }, [color1, color2, solidColor, isGradient]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      {supportsGradient && (
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="checkbox"
            id={`gradient-${label}`}
            checked={isGradient}
            onChange={(e) => setIsGradient(e.target.checked)}
            className="rounded"
          />
          <label htmlFor={`gradient-${label}`} className="text-sm text-gray-600 dark:text-gray-400">
            Use gradient
          </label>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {isGradient && supportsGradient ? (
          <>
            <div className="flex items-center space-x-1">
              <input
                type="color"
                value={color1}
                onChange={(e) => setColor1(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-500">Start</span>
            </div>
            <div className="flex items-center space-x-1">
              <input
                type="color"
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-500">End</span>
            </div>
          </>
        ) : (
          <input
            type="color"
            value={solidColor}
            onChange={(e) => setSolidColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
        )}
        
        <div 
          className="flex-1 h-10 rounded border border-gray-300 dark:border-gray-600"
          style={{ 
            background: isGradient && supportsGradient 
              ? `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
              : solidColor 
          }}
        />
        
        <input
          type="text"
          value={isGradient && supportsGradient 
            ? `gradient(${color1}, ${color2})`
            : solidColor}
          readOnly
          className="text-xs px-2 py-1 w-32 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
        />
      </div>
    </div>
  );
};