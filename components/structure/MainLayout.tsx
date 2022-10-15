import { ColorScheme, ColorSchemeProvider, MantineProvider, MantineThemeOverride } from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';
import { useHotkeys, useLocalStorage } from '@mantine/hooks';
import PageLayout from './PageLayout';

function ProvidersLayout({ children }: React.PropsWithChildren<{}>) {

  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'mantine-color-scheme',
    defaultValue: 'light',
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) => setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  useHotkeys([['mod+J', () => toggleColorScheme()]]);

  const providerTheme: MantineThemeOverride = {
    colorScheme,
    components: {
      Text: {
        styles: (theme) => ({
          root: {
            color: theme.colorScheme === 'dark' ? theme.colors.gray[6] : theme.colors.dark[7]
          },
        })
      },
      Title: {
        styles: (theme) => ({
          root: {
            color: theme.colorScheme === 'dark' ? theme.colors.gray[5] : theme.colors.dark[4]
          },
        })
      }
    }
  }

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider theme={providerTheme}>
        <NotificationsProvider>
          <PageLayout>
            {children}
          </PageLayout>
        </NotificationsProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  )
}

export default ProvidersLayout