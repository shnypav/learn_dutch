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
  const options = [
    {
      value: "words" as ContentType,
      label: "Words",
      description: "Learn vocabulary",
    },
    {
      value: "verbs" as ContentType,
      label: "Verbs",
      description: "Learn irregular verbs",
    },
  ];

  return (
    <div className="flex flex-col space-y-4">
      <div className="card-bg rounded-xl p-2 flex space-x-2 w-full">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => !disabled && onContentTypeChange(option.value)}
            disabled={disabled}
            className={`
              px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300
              border-2 flex-1
              ${
                contentType === option.value
                  ? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-xl border-green-400 transform scale-105"
                  : "text-primary btn-primary border-transparent hover:border-white hover:border-opacity-30"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-102"}
            `}
            title={option.description}
          >
            <div className="flex flex-col items-center space-y-4">
              <span className="text-lg font-bold">{option.label}</span>
              <span
                className={`text-xs font-semibold ${contentType === option.value ? "text-green-100" : "opacity-70"}`}
              >
                {option.value === "words" ? "Vocabulary" : "Irregular"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ContentTypeSwitcher;
