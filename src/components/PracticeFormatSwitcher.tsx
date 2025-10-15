import type { PracticeFormat } from "../types";

interface PracticeFormatSwitcherProps {
  practiceFormat: PracticeFormat;
  onFormatChange: (format: PracticeFormat) => void;
  disabled?: boolean;
}

const PracticeFormatSwitcher: React.FC<PracticeFormatSwitcherProps> = ({
  practiceFormat,
  onFormatChange,
  disabled = false,
}) => {
  const formats = [
    {
      value: "input" as PracticeFormat,
      label: "⌨️",
      description: "Type Answer",
    },
    {
      value: "multiple-choice" as PracticeFormat,
      label: "☑️",
      description: "Multiple Choice",
    },
  ];

  return (
    <div className="flex flex-col space-y-2">
      <div className="card-bg rounded-xl p-2 flex space-x-2 w-full">
        {formats.map((format) => (
          <button
            key={format.value}
            onClick={() => !disabled && onFormatChange(format.value)}
            disabled={disabled}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
              border-2 flex-1
              ${
                practiceFormat === format.value
                  ? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-xl border-green-400 transform scale-105"
                  : "text-primary btn-primary border-transparent hover:border-white hover:border-opacity-30"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-102"}
            `}
            title={format.description}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-2xl">{format.label}</span>
              <span
                className={`text-xs font-semibold ${practiceFormat === format.value ? "text-green-100" : "opacity-70"}`}
              >
                {format.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PracticeFormatSwitcher;
