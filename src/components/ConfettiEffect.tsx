import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  const previousTrigger = useRef<boolean>(false);

  useEffect(() => {
    // Only trigger if the trigger changed from false to true
    if (!trigger || previousTrigger.current === trigger) {
      previousTrigger.current = trigger;
      return;
    }

    previousTrigger.current = trigger;

    // Create a more colorful confetti burst
    const colors = ['#22c55e', '#10b981', '#34d399', '#fbbf24', '#f59e0b', '#fb923c'];

    // Fire confetti from different angles for a more dynamic effect
    const fireConfetti = () => {
      const count = 100;
      const defaults = {
        origin: { y: 0.7 },
        colors: colors,
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      // Fire multiple bursts with different settings
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    };

    // Small delay to sync with the visual feedback
    const timeoutId = setTimeout(() => {
      fireConfetti();

      // Call onComplete after animation finishes
      if (onComplete) {
        setTimeout(onComplete, 3000); // Confetti lasts about 3 seconds
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [trigger, onComplete]);

  // This component doesn't render anything visible
  return null;
}