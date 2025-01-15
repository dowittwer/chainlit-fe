import { WidgetContext } from 'context';
import { EvoyaConfig } from 'evoya/types';
import { useContext, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { Toaster } from 'sonner';
import { IWidgetConfig } from 'types';
import Widget from 'widget';
import WidgetEmbedded from 'widget-embedded';

import { Theme, ThemeProvider } from '@mui/material/styles';

import { overrideTheme } from '@chainlit/app/src/App';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { settingsState } from '@chainlit/app/src/state/settings';
import { makeTheme } from '@chainlit/app/src/theme';
import { useAuth, useChatInteract, useConfig } from '@chainlit/react-client';

interface Props {
  widgetConfig: IWidgetConfig;
  evoya: EvoyaConfig;
}

declare global {
  interface Window {
    cl_shadowRootElement: HTMLDivElement;
  }
}

export default function App({ widgetConfig, evoya }: Props) {
  const { accessToken } = useContext(WidgetContext);
  const { config } = useConfig(accessToken);
  const { setAccessToken } = useAuth();
  const [settings, setSettings] = useRecoilState(settingsState);
  const [theme, setTheme] = useState<Theme | null>(null);
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';
  const { clear } = useChatInteract();

  useEffect(() => {
    setAccessToken(widgetConfig.accessToken);
  }, [widgetConfig.accessToken]);

  useEffect(() => {
    if (evoya.reset) {
      clear();
    }
    if (!config) return;

    const themeVariant = widgetConfig.theme || config.ui.theme.default;
    window.theme = config.ui.theme;
    widgetConfig.theme = themeVariant;
    setSettings((old) => ({
      ...old,
      theme: themeVariant
    }));

    const _theme = overrideTheme(
      makeTheme(
        themeVariant || settings.theme,
        widgetConfig.fontFamily,
        {
          values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536
          }
        },
        {
          primary: {
            main: widgetConfig.button?.style?.bgcolor ?? '#ff2e4e',
            dark: widgetConfig.button?.style?.bgcolorHover ?? '#ff4764',
            contrastText: widgetConfig.button?.style?.color ?? '#ffffff'
          }
        }
      )
    );

    if (!_theme.components) {
      _theme.components = {};
    }
    _theme.components = {
      ..._theme.components,
      MuiPopover: {
        defaultProps: {
          container: window.cl_shadowRootElement
        }
      },
      MuiPopper: {
        defaultProps: {
          container: window.cl_shadowRootElement
        }
      },
      MuiModal: {
        defaultProps: {
          container: window.cl_shadowRootElement
        }
      }
    };

    setTheme(_theme);

    const loadTranslations = async () => {
      try {
        const translations = await import(
          `../../../translations/${languageInUse}.json`
        );
        i18n.addResourceBundle(languageInUse, 'translation', translations);
        i18n.changeLanguage(languageInUse);
      } catch (error) {
        console.error(
          `Could not load translations for ${languageInUse}:`,
          error
        );
      }
    };

    loadTranslations();
  }, [config]);

  if (!config || !theme) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Toaster
        richColors
        className="toast show"
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: theme.typography.fontFamily
          },
          duration: 2000
        }}
      />
      {evoya.type === 'default' ? (
        <Widget config={widgetConfig} evoya={evoya} />
      ) : (
        <WidgetEmbedded />
      )}
    </ThemeProvider>
  );
}
