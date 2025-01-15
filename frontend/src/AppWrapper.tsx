import App from 'App';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import getRouterBasename from 'utils/router';

import { useAuth, useConfig } from '@chainlit/react-client';

z;
export default function AppWrapper() {
  const { isAuthenticated, isReady } = useAuth();
  const { language: languageInUse } = useConfig();
  const { i18n } = useTranslation();

  async function loadTranslation(language: string) {
    try {
      const translation = await import(`../../translations/${language}.json`);
      i18n.addResourceBundle(language, 'translation', translation);
      i18n.changeLanguage(language);
    } catch (error) {
      console.error(
        `Could not load translation for language: ${language}`,
        error
      );
    }
  }

  useEffect(() => {
    if (!languageInUse) return;
    loadTranslation(languageInUse);
  }, [languageInUse]);

  if (
    isReady &&
    !isAuthenticated &&
    window.location.pathname !== getRouterBasename() + '/login' &&
    window.location.pathname !== getRouterBasename() + '/login/callback'
  ) {
    window.location.href = getRouterBasename() + '/login';
  }

  if (!isReady) {
    return null;
  }

  return <App />;
}
