import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModeToggle from './ModeToggle';
import '@testing-library/jest-dom';

describe('ModeToggle', () => {
  it('should render both practice and test buttons', () => {
    render(
      <ModeToggle
        mode="practice"
        onModeChange={() => {}}
      />
    );
    
    expect(screen.getByText(/Practice/i)).toBeInTheDocument();
    expect(screen.getByText(/Test/i)).toBeInTheDocument();
  });

  it('should highlight the active mode', () => {
    const { rerender } = render(
      <ModeToggle
        mode="practice"
        onModeChange={() => {}}
      />
    );
    
    const practiceButton = screen.getByText(/Practice/i);
    expect(practiceButton).toHaveClass('active');
    
    rerender(
      <ModeToggle
        mode="test"
        onModeChange={() => {}}
      />
    );
    
    const testButton = screen.getByText(/Test/i);
    expect(testButton).toHaveClass('active');
  });

  it('should call onModeChange when clicking practice', () => {
    const handleModeChange = vi.fn();
    render(
      <ModeToggle
        mode="test"
        onModeChange={handleModeChange}
      />
    );
    
    const practiceButton = screen.getByText(/Practice/i);
    fireEvent.click(practiceButton);
    
    expect(handleModeChange).toHaveBeenCalledWith('practice');
  });

  it('should call onModeChange when clicking test', () => {
    const handleModeChange = vi.fn();
    render(
      <ModeToggle
        mode="practice"
        onModeChange={handleModeChange}
      />
    );
    
    const testButton = screen.getByText(/Test/i);
    fireEvent.click(testButton);
    
    expect(handleModeChange).toHaveBeenCalledWith('test');
  });

  it('should not call onModeChange when clicking current mode', () => {
    const handleModeChange = vi.fn();
    render(
      <ModeToggle
        mode="practice"
        onModeChange={handleModeChange}
      />
    );
    
    const practiceButton = screen.getByText(/Practice/i);
    fireEvent.click(practiceButton);
    
    expect(handleModeChange).not.toHaveBeenCalled();
  });

  it('should have appropriate ARIA attributes', () => {
    render(
      <ModeToggle
        mode="practice"
        onModeChange={() => {}}
      />
    );
    
    const toggleGroup = screen.getByRole('group');
    expect(toggleGroup).toHaveAttribute('aria-label', 'Mode selection');
  });

  it('should disable inactive button in certain conditions', () => {
    render(
      <ModeToggle
        mode="practice"
        onModeChange={() => {}}
        disabled={true}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});