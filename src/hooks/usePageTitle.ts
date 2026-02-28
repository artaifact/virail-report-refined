import { useEffect } from 'react';

const APP_NAME = 'Virail Studio';

/**
 * Met à jour le titre de l'onglet du navigateur.
 * Format : "Titre - Virail Studio"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} - ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
