import React, { createContext, useContext, useEffect, useState } from 'react';
import useSound from 'use-sound';
import { useSettings } from './SettingsContext';

// Using reliable public CDNs for UI sounds
const SOUNDS = {
  'sci-fi': {
    click: 'https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3', // Cyber-Click
    hum: 'https://cdn.freesound.org/previews/154/154173_2703579-lq.mp3',   // Power-On Hum
    chirp: 'https://cdn.freesound.org/previews/320/320181_527080-lq.mp3',  // Listening Chirp
    blip: 'https://cdn.freesound.org/previews/342/342200_5260872-lq.mp3',  // Data Processed Blip
    notification: 'https://cdn.freesound.org/previews/235/235911_2398403-lq.mp3', // Tech Notification
  },
  'minimal': {
    click: 'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3', // Soft click
    hum: 'https://cdn.freesound.org/previews/538/538549_10522778-lq.mp3', // Soft hum
    chirp: 'https://cdn.freesound.org/previews/404/404743_1407373-lq.mp3', // Soft chirp
    blip: 'https://cdn.freesound.org/previews/411/411088_5121236-lq.mp3', // Soft blip
    notification: 'https://cdn.freesound.org/previews/411/411090_5121236-lq.mp3', // Soft notification
  },
  'retro': {
    click: 'https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3', // 8-bit click
    hum: 'https://cdn.freesound.org/previews/270/270318_5123851-lq.mp3', // 8-bit hum
    chirp: 'https://cdn.freesound.org/previews/270/270333_5123851-lq.mp3', // 8-bit chirp
    blip: 'https://cdn.freesound.org/previews/270/270326_5123851-lq.mp3', // 8-bit blip
    notification: 'https://cdn.freesound.org/previews/270/270311_5123851-lq.mp3', // 8-bit notification
  }
};

interface GlobalInteractionContextType {
  playChirp: () => void;
  playBlip: () => void;
  playNotification: () => void;
}

const GlobalInteractionContext = createContext<GlobalInteractionContextType | null>(null);

export const useGlobalInteraction = () => {
  const context = useContext(GlobalInteractionContext);
  if (!context) {
    throw new Error('useGlobalInteraction must be used within a GlobalInteractionProvider');
  }
  return context;
};

export const GlobalInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const { soundTheme, soundEnabled } = useSettings();

  const currentSounds = SOUNDS[soundTheme] || SOUNDS['sci-fi'];

  // Initialize sounds
  const [playClick] = useSound(currentSounds.click, { volume: 0.5, soundEnabled: soundEnabled });
  const [playHum] = useSound(currentSounds.hum, { volume: 0.3, soundEnabled: soundEnabled });
  const [playChirp] = useSound(currentSounds.chirp, { volume: 0.6, soundEnabled: soundEnabled });
  const [playBlip] = useSound(currentSounds.blip, { volume: 0.6, soundEnabled: soundEnabled });
  const [playNotification] = useSound(currentSounds.notification, { volume: 0.5, soundEnabled: soundEnabled });

  const safePlayChirp = () => { if (soundEnabled) playChirp(); };
  const safePlayBlip = () => { if (soundEnabled) playBlip(); };
  const safePlayNotification = () => { if (soundEnabled) playNotification(); };

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!soundEnabled) return;

      // 2. The "System Wake-up" (Entry Logic)
      if (!hasInteracted) {
        playHum();
        setHasInteracted(true);
      }

      // 1. The Invisible Sound Layer (Global Event Listener)
      const target = e.target as HTMLElement;
      const isClickable = 
        target.closest('button') || 
        target.closest('input') || 
        target.closest('a') || 
        target.closest('[role="button"]') || 
        target.closest('.menu-item');
      
      if (isClickable) {
        playClick();
      }
    };

    // Use capture phase to ensure it fires before React event handlers stop propagation
    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, [hasInteracted, playClick, playHum, soundEnabled]);

  return (
    <GlobalInteractionContext.Provider value={{ playChirp: safePlayChirp, playBlip: safePlayBlip, playNotification: safePlayNotification }}>
      {children}
    </GlobalInteractionContext.Provider>
  );
};
