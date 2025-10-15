# Technical Specification: Dutch Language Learning Web Application

## Project Overview

Create a modern, minimalistic web application for learning Dutch vocabulary using a CSV dataset. The app should provide an elegant interface for practicing word translations between Dutch and English with a focus on contemporary design patterns and user experience.

## Technical Requirements

### Tech Stack

- **Frontend**: React.js with TypeScript
- **Styling**: Tailwind CSS + custom CSS for gradients and animations
- **Data Storage**: Browser LocalStorage for user progress
- **CSV Parsing**: Papa Parse library
- **Deployment**: Static hosting (Netlify/Vercel ready)

### Project Structure

```
/src
  /components
    - WordCard.tsx
    - ModeToggle.tsx
    - ProgressIndicator.tsx
    - StatsDashboard.tsx
    - InputField.tsx
  /utils
    - csvParser.ts
    - fuzzyMatch.ts
    - wordManager.ts
    - storage.ts
  /styles
    - globals.css
    - components.module.css
  /types
    - index.ts
  /data
    - vocabulary.csv
  App.tsx
  main.tsx
```

## Functional Requirements

### Core Features

1. **CSV Data Loading**: Automatically parse and load Dutch-English word pairs from CSV file
2. **Learning Modes**:
   - **NL → EN Mode**: Display Dutch word, user inputs English translation
   - **EN → NL Mode**: Display English word, user inputs Dutch translation
3. **Answer Validation**: Fuzzy matching to accept typos and minor spelling errors
4. **Random Word Selection**: Ensure varied practice without immediate repetition
5. **Mode Switching**: Easy toggle between translation directions

### User Interface Features

1. **Modern Design**: Clean, minimalistic interface following 2024 design trends
2. **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
3. **Progress Tracking**: Visual indicators for session progress
4. **Feedback System**: Immediate visual feedback for correct/incorrect answers
5. **Statistics**: Track accuracy, streak, and learning progress

## Design Specifications

### Visual Design

- **Color Palette**: Modern gradients (e.g., blue-to-purple, teal-to-cyan)
- **Typography**: Clean, readable fonts (Inter, Poppins, or similar)
- **Layout**: Centered card-based design with generous white space
- **Animations**: Subtle micro-interactions and smooth transitions
- **Icons**: Minimal, outline-style icons for controls

### Design System

```css
/* Primary gradient backgrounds */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* Typography scale */
- Heading: 2.5rem, font-weight: 700
- Word display: 2rem, font-weight: 600
- Input text: 1.125rem, font-weight: 400
- UI text: 0.875rem, font-weight: 500

/* Spacing system */
- Card padding: 2rem
- Element margins: 1rem, 1.5rem, 2rem
- Border radius: 0.75rem for cards, 0.5rem for inputs
```

## Implementation Details

### CSV File Format

```csv
dutch_word,english_translation
hond,dog
kat,cat
huis,house
auto,car
```

### Core Components

#### WordCard Component

```typescript
interface WordCardProps {
  word: string;
  mode: "nl-en" | "en-nl";
  onAnswer: (answer: string) => void;
  feedback?: "correct" | "incorrect" | null;
}
```

#### Fuzzy Matching Logic

- Accept answers with up to 2 character differences
- Ignore case sensitivity
- Handle common typos (doubled letters, swapped adjacent characters)
- Consider multiple correct translations if they exist

#### Progress Tracking

- Session statistics (correct/total answers)
- Streak counter (consecutive correct answers)
- Overall accuracy percentage
- Words learned counter

### Data Management

- Load CSV on app initialization
- Shuffle word order for each session
- Prevent immediate repetition of the same word
- Store user progress in localStorage
- Handle multiple correct translations per word

## User Experience Flow

1. **App Launch**: Display loading screen while parsing CSV
2. **Mode Selection**: User chooses NL→EN or EN→NL mode
3. **Word Presentation**: Display random word in large, clear typography
4. **Input Phase**: User types translation in input field
5. **Validation**: Check answer with fuzzy matching
6. **Feedback**: Show immediate visual feedback (green/red indicator)
7. **Next Word**: Automatically advance to next word after 1.5 seconds
8. **Progress**: Continuously update progress indicators

## Technical Implementation Notes

### Performance Considerations

- Lazy load CSV data
- Implement virtual scrolling if dataset is large
- Optimize re-renders with React.memo
- Use debounced input validation

### Error Handling

- Graceful CSV parsing error handling
- Network failure fallbacks
- Invalid input validation
- Browser compatibility checks

### Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode compatibility
- Focus management for inputs

## Deployment Requirements

### Build Configuration

- Environment variables for different deployment stages
- Optimized production build
- Asset compression and minification
- Progressive Web App (PWA) capabilities

### Testing

- Unit tests for utility functions
- Integration tests for core user flows
- Cross-browser compatibility testing
- Mobile responsiveness testing

## Success Criteria

1. **Functionality**: All core features working correctly
2. **Design**: Modern, polished interface matching design specifications
3. **Performance**: Fast loading and smooth interactions
4. **Usability**: Intuitive user experience with clear feedback
5. **Reliability**: Robust error handling and data persistence

## Timeline Estimate

- **Setup & CSV Integration**: 2-3 hours
- **Core Components**: 4-5 hours
- **Styling & Animations**: 3-4 hours
- **Testing & Polish**: 2-3 hours
- **Total**: 11-15 hours

## Deliverables

1. Complete React application with all specified features
2. Deployed application with public URL
3. README with setup and usage instructions
4. Clean, commented codebase following best practices
