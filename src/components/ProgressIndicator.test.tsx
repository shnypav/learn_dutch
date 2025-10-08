import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressIndicator from './ProgressIndicator';
import '@testing-library/jest-dom';

describe('ProgressIndicator', () => {
  it('should display correct and incorrect counts', () => {
    const sessionStats = {
      correct: 5,
      total: 8,
      accuracy: 62.5,
      streak: 0
    };
    render(<ProgressIndicator sessionStats={sessionStats} />);
    
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/8/)).toBeInTheDocument();
  });

  it('should display current streak', () => {
    const sessionStats = {
      correct: 10,
      total: 12,
      accuracy: 83.3,
      streak: 7
    };
    render(<ProgressIndicator sessionStats={sessionStats} />);
    
    expect(screen.getByText(/7/)).toBeInTheDocument();
  });

  it('should handle zero values', () => {
    const sessionStats = {
      correct: 0,
      total: 0,
      accuracy: 0,
      streak: 0
    };
    render(<ProgressIndicator sessionStats={sessionStats} />);
    
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('should display accuracy percentage correctly', () => {
    const sessionStats = {
      correct: 8,
      total: 10,
      accuracy: 80,
      streak: 3
    };
    render(<ProgressIndicator sessionStats={sessionStats} />);
    
    expect(screen.getByText(/80/)).toBeInTheDocument();
  });

  it('should show 0% accuracy when no answers', () => {
    const sessionStats = {
      correct: 0,
      total: 0,
      accuracy: 0,
      streak: 0
    };
    render(<ProgressIndicator sessionStats={sessionStats} />);
    
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it('should show 100% accuracy when all correct', () => {
    const sessionStats = {
      correct: 10,
      total: 10,
      accuracy: 100,
      streak: 10
    };
    render(<ProgressIndicator sessionStats={sessionStats} />);
    
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('should handle large numbers', () => {
    const sessionStats = {
      correct: 999,
      total: 1110,
      accuracy: 90,
      streak: 50
    };
    render(<ProgressIndicator sessionStats={sessionStats} />);
    
    expect(screen.getByText(/999/)).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const sessionStats = {
      correct: 5,
      total: 10,
      accuracy: 50,
      streak: 2
    };
    const { container } = render(
      <ProgressIndicator sessionStats={sessionStats} className="custom-class" />
    );
    
    const element = container.firstChild;
    expect(element).toHaveClass('custom-class');
  });
});