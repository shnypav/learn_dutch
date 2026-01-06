import type { ContentType } from "../types";

interface ContentTypeSwitcherProps {
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
  disabled?: boolean;
}

const ContentTypeSwitcher: React.FC<ContentTypeSwitcherProps> = ({
  contentType,
  onContentTypeChange,
  disabled = false,
}) => {
  const vocabularyOptions = [
    {
      value: "words" as ContentType,
      label: "Words",
      description: "Learn vocabulary",
      subtitle: "Vocabulary",
    },
    {
      value: "verbs" as ContentType,
      label: "Verbs",
      description: "Learn irregular verbs",
      subtitle: "Irregular",
    },
  ];

  const sentenceOption = {
    value: "sentences" as ContentType,
    label: "Sentences",
    description: "Build sentences from words",
    subtitle: "Construction",
  };

  const getButtonClass = (isSelected: boolean) => `
    px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300
    border-2 flex-1
    ${
      isSelected
        ? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-xl border-green-400 transform scale-105"
        : "text-primary btn-primary border-transparent hover:border-white hover:border-opacity-30"
    }
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-102"}
  `;

  return (
    <div className="card-bg rounded-xl p-2 grid grid-cols-2 gap-2 w-full">
      {/* Row 1: Words and Verbs */}
      {vocabularyOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => !disabled && onContentTypeChange(option.value)}
          disabled={disabled}
          className={getButtonClass(contentType === option.value)}
          title={option.description}
        >
          <div className="flex flex-col items-center space-y-4">
            <span className="text-lg font-bold">{option.label}</span>
            <span
              className={`text-xs font-semibold ${contentType === option.value ? "text-green-100" : "opacity-70"}`}
            >
              {option.subtitle}
            </span>
          </div>
        </button>
      ))}

      {/* Row 2: Sentences (spans both columns) */}
      <button
        onClick={() => !disabled && onContentTypeChange(sentenceOption.value)}
        disabled={disabled}
        className={getButtonClass(contentType === sentenceOption.value) + " col-span-2"}
        title={sentenceOption.description}
      >
        <div className="flex flex-col items-center space-y-4">
          <span className="text-lg font-bold">{sentenceOption.label}</span>
          <span
            className={`text-xs font-semibold ${contentType === sentenceOption.value ? "text-green-100" : "opacity-70"}`}
          >
            {sentenceOption.subtitle}
          </span>
        </div>
      </button>
    </div>
  );
};

export default ContentTypeSwitcher;
