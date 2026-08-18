import React, { useState, useCallback } from 'react';

export interface AwakeningState {
  id: number;
  phase: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
  isDeactivating?: boolean;
}

export function useAwakening(isAwakened: boolean, setIsAwakened: (value: boolean) => void) {
  const [awakening, setAwakening] = useState<AwakeningState | null>(null);

  const triggerAwakening = useCallback((e: React.MouseEvent) => {
    if (awakening) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left;
    const startY = rect.top;

    // Immediately trigger shockwave from the avatar position
    setAwakening({ 
      id: Date.now(), 
      phase: 'shockwave', 
      startX, 
      startY, 
      width: rect.width, 
      height: rect.height, 
      isDeactivating: isAwakened 
    });

    if (isAwakened) {
      // Smooth deactivation
      setTimeout(() => {
        setIsAwakened(false);
      }, 1200);
      setTimeout(() => {
        setAwakening(null);
      }, 3600);
    } else {
      // Cinematic activation with multi-layered cosmic shockwave
      setTimeout(() => {
        setIsAwakened(true);
      }, 1000);
      setTimeout(() => {
        setAwakening(null);
      }, 4200);
    }
  }, [awakening, isAwakened, setIsAwakened]);

  const handleAwakeningResponse = useCallback((ready: boolean) => {
    if (!awakening) return;
    if (ready) {
      setIsAwakened(true);
    }
    setAwakening(null);
  }, [awakening, setIsAwakened]);

  return {
    awakening,
    triggerAwakening,
    handleAwakeningResponse
  };
}
