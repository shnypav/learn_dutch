# 🇳🇱 Dutch Language Learning App

A comprehensive, AI-powered Dutch language learning platform with vocabulary and verb conjugation practice. Features intelligent hints, progress tracking, and multiple learning modes. Built with React, TypeScript, and Tailwind CSS.

![Screenshot](public/screenshot.gif)

## ✨ Features

### 📚 **Dual Content Types**

- **Vocabulary Learning**: Practice Dutch-English word pairs from curated datasets
- **Irregular Verbs**: Master Dutch verb conjugations with infinitive, imperfectum, and perfectum forms

### 🎯 **Multiple Learning Modes**

- 🔄 **Word Modes**: Dutch → English and English → Dutch translation
- 🔀 **Verb Modes**: Random forms, Infinitive focus, Imperfectum practice, Perfectum training

### 🤖 **AI-Powered Learning**

- **Smart Hints**: AI-generated contextual examples and usage tips via Perplexity API
- **Progressive Hint System**: 4-level hint progression from subtle to explicit
- **Hover Context**: Instant example sentences for better understanding

### 📊 **Advanced Analytics**

- **Progress Tracking**: Session statistics and comprehensive all-time metrics
- **Hint Analytics**: Track hint usage patterns and learning efficiency
- **Streak System**: Build and maintain learning streaks across content types
- **Known Words Management**: Mark and manage already-learned vocabulary

### 🎨 **Modern Experience**

- **Theme System**: Multiple visual themes (Ocean, Duo) for personalized experience
- **Smart Fuzzy Matching**: Accepts minor typos and spelling variations
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Beautiful UI**: Smooth animations, gradients, and intuitive micro-interactions
- **Local Storage**: Automatic progress saving with persistent data

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd fresher
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build
```

## 🎯 How to Use

### Getting Started

1. **Choose Content Type**: Select between Words or Irregular Verbs learning
2. **Select Learning Mode**: Pick your preferred mode (translation directions or verb forms)
3. **Configure AI Hints** (Optional): Set up Perplexity API key for AI-powered contextual hints

### Learning Flow

1. **Study the Content**: A word or verb form will be displayed
2. **Use Smart Hints**: Hover over words for AI-generated examples, or use progressive hints if stuck
3. **Type Your Answer**: Enter the translation or conjugation
4. **Get Instant Feedback**: Receive immediate validation with fuzzy matching tolerance
5. **Mark Known Items**: Checkbox items you already know to focus on challenging content
6. **Track Progress**: Monitor accuracy, streaks, hint usage, and learning analytics

### Advanced Features

- **Statistics Dashboard**: View comprehensive metrics including hint analytics and known words management
- **Theme Switching**: Personalize your learning environment with different visual themes
- **Persistent Progress**: All data automatically saves locally for seamless session continuity

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom animations and themes
- **Build Tool**: Vite
- **Data Processing**: Papa Parse for CSV datasets
- **State Management**: React Context + Hooks
- **AI Integration**: Perplexity API for intelligent hints
- **Storage**: Browser LocalStorage with advanced data structures
- **UI Components**: Custom responsive components with accessibility features

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── WordCard.tsx     # Displays words/verbs with AI hints
│   ├── InputField.tsx   # Smart input with validation feedback
│   ├── ModeToggle.tsx   # Content type and mode switcher
│   ├── ProgressIndicator.tsx  # Real-time session progress
│   ├── StatsDashboard.tsx     # Comprehensive analytics dashboard
│   ├── ThemeToggle.tsx  # Visual theme selector
│   ├── AIHintConfig.tsx # AI hint system configuration
│   └── KnownWordsManager.tsx  # Known vocabulary management
├── contexts/            # React contexts
│   ├── ThemeContext.tsx # Theme state management
│   └── AIHintContext.tsx # AI hint configuration
├── utils/               # Utility functions
│   ├── csvParser.ts     # Multi-dataset CSV processing
│   ├── fuzzyMatch.ts    # Advanced fuzzy string matching
│   ├── wordManager.ts   # Content selection and filtering
│   ├── verbManager.ts   # Verb conjugation handling
│   ├── storage.ts       # Enhanced LocalStorage utilities
│   └── aiHints.ts       # Perplexity API integration
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application with context providers
└── main.tsx            # Application entry point

public/
└── data/
    ├── dutch_common_words.csv     # Vocabulary dataset
    └── dutch_irregular_verbs.csv  # Verb conjugation dataset
```

## 🎨 Features in Detail

### 🤖 AI-Powered Hints System

- **Perplexity Integration**: Real-time AI-generated contextual examples and usage tips
- **Progressive Disclosure**: 4-level hint system from subtle clues to explicit answers
- **Hover Context**: Instant example sentences appear on word hover
- **Smart Configuration**: Easy API key setup with validation and testing
- **Usage Analytics**: Track hint effectiveness and learning patterns

### 🧠 Intelligent Answer Validation

- **Advanced Fuzzy Matching**: Accepts minor typos (up to 2 character differences)
- **Case Insensitive**: Flexible input handling for natural typing
- **Multiple Answer Support**: Handles alternative answers separated by `/` or `,`
- **Punctuation Normalization**: Smart whitespace and punctuation handling
- **Verb Form Recognition**: Specialized validation for Dutch verb conjugations

### 📈 Comprehensive Analytics

- **Multi-Dimensional Tracking**: Words, verbs, hints, streaks, and accuracy metrics
- **Session vs. All-Time**: Detailed breakdowns of current and historical performance
- **Learning Insights**: Hint usage trends, difficulty patterns, and progress visualization
- **Known Words Management**: Track mastered vocabulary with easy unmarking options
- **Motivational Feedback**: Context-aware encouragement based on performance patterns

### 🎨 Enhanced User Experience

- **Multi-Theme Support**: Ocean and Duo themes with smooth transitions
- **Responsive Design**: Optimized layouts for desktop, tablet, and mobile devices
- **Smooth Animations**: Fade-ins, slide-ups, hover effects, and micro-interactions
- **Keyboard Navigation**: Full keyboard support with Enter submissions
- **Visual Feedback**: Color-coded feedback system for learning reinforcement
- **Content Type Switching**: Seamless transitions between words and verb modes

## 📊 Data Structure

### Vocabulary Dataset (`dutch_common_words.csv`)

```csv
Dutch,English
hond,dog
kat,cat
huis,house
auto,car
```

### Irregular Verbs Dataset (`dutch_irregular_verbs.csv`)

```csv
Infinitive,Imperfectum,Perfectum,English
zijn,was/waren,geweest,to be
hebben,had/hadden,gehad,to have
gaan,ging/gingen,gegaan,to go
komen,kwam/kwamen,gekomen,to come
```

## 🎨 Customization

### Adding Content

1. **Vocabulary**: Edit `public/data/dutch_common_words.csv` following the `Dutch,English` format
2. **Irregular Verbs**: Edit `public/data/dutch_irregular_verbs.csv` with `Infinitive,Imperfectum,Perfectum,English` columns
3. Restart the development server to load new content

### AI Hints Configuration

1. Obtain a Perplexity API key from [perplexity.ai](https://www.perplexity.ai)
2. Use the in-app configuration dialog to set up AI hints
3. Test the integration with the built-in validation system

### Theme Customization

- **Built-in Themes**: Switch between Ocean and Duo themes via the theme toggle
- **Custom Styling**: Modify `src/index.css` for global styles
- **Tailwind Configuration**: Update `tailwind.config.js` for new colors and animations
- **Component Styling**: Edit individual component files for specific changes

## 🚀 Deployment

This app is ready for deployment on:

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your Git repository
- **GitHub Pages**: Use GitHub Actions for automatic deployment

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Happy Learning! 🎉 Veel succes met het leren van Nederlands! 🇳🇱**
