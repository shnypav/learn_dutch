import type { PracticeMode } from '../types';

interface PracticeModeSwitcherProps {
  practiceMode: PracticeMode;
  onPracticeModeChange: (mode: PracticeMode) => void;
  disabled?: boolean;
}

const PracticeModeSwitcher: React.FC<PracticeModeSwitcherProps> = ({
  practiceMode,
  onPracticeModeChange,
  disabled = false
}) => {
  const modes: { value: PracticeMode; label: string; icon: string; description: string }[] = [
    {
      value: 'typing',
      label: 'Typing',
      icon: '⌨️',
      description: 'Type your answer'
    },
    {
      value: 'multiple-choice',
      label: 'Multiple Choice',
      icon: '✓',
      description: 'Choose from 4 options'
    }
  ];

  return (
    <div className="card-bg rounded-xl p-4 border-2 border-white border-opacity-20">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-secondary-light uppercase tracking-wide">
          Practice Mode
        </h3>
      </div>
      <div className="space-y-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onPracticeModeChange(mode.value)}
            disabled={disabled}
            className={`
              w-full p-3 rounded-lg text-left transition-all duration-200
              ${practiceMode === mode.value
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                : 'bg-white bg-opacity-5 text-white hover:bg-opacity-10'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
            `}
            aria-label={`Switch to ${mode.label} mode`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{mode.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{mode.label}</div>
                <div className={`text-xs ${practiceMode === mode.value ? 'text-white text-opacity-90' : 'text-secondary-light'}`}>
                  {mode.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PracticeModeSwitcher;
