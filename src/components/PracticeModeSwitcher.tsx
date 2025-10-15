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
    { value: 'type', label: 'Type Answer', icon: '⌨️', description: 'Type your answer' },
    { value: 'multiple-choice', label: 'Multiple Choice', icon: '🎯', description: '4 answer options' }
  ];

  return (
    <div className="card-bg rounded-xl p-4 border-2 border-white border-opacity-20">
      <div className="mb-3">
        <span className="text-secondary-light text-xs font-medium uppercase tracking-wide">
          Practice Mode
        </span>
      </div>
      <div className="space-y-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => !disabled && onPracticeModeChange(mode.value)}
            disabled={disabled}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
              practiceMode === mode.value
                ? 'bg-white bg-opacity-20 text-primary-light border-2 border-primary-light'
                : 'bg-white bg-opacity-5 text-secondary-light border-2 border-transparent hover:bg-opacity-10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{mode.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{mode.label}</div>
                <div className="text-xs opacity-70">{mode.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PracticeModeSwitcher;
