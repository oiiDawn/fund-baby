'use client';

import { useEffect } from 'react';

interface UseDashboardModalEffectsOptions {
  isAnyModalOpen: boolean;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
}

export function useDashboardModalEffects({
  isAnyModalOpen,
  isSettingsOpen,
  onCloseSettings,
}: UseDashboardModalEffectsOptions) {
  useEffect(() => {
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isSettingsOpen) {
        onCloseSettings();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, onCloseSettings]);
}
