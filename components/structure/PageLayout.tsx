import { useState } from 'react';
import { IconMoonStars, IconSun } from '@tabler/icons';
import { ActionIcon, AppShell, Group, Header, Title, Text, useMantineTheme, useMantineColorScheme, Stack } from '@mantine/core';
import Head from 'next/head';


export interface PageLayoutProps {
  children?: React.ReactNode
  auth?: boolean
  footer?: React.ReactElement<any, string | React.JSXElementConstructor<any>>
  noBoxWidth?: boolean
}


export default function PageLayout(props: PageLayoutProps) {

  const theme = useMantineTheme();
  const { toggleColorScheme } = useMantineColorScheme();
  const [opened, setOpened] = useState(false);


  return (
    <AppShell
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      header={
        <Header height={70} p="md" >
          <Group style={{ alignItems: 'center' }}>
            <Stack spacing={0} sx={{flex: 1}}>
              <Title size="md" order={1} mr="auto">ESG Performance NLP Meta-Study</Title>
              <Text size="xs">Pictet Wealth Management x Effixis</Text>
            </Stack>
            <ActionIcon variant="subtle" onClick={() => toggleColorScheme()} size={30}>
              {theme.colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoonStars size={16} />}
            </ActionIcon>
          </Group>
        </Header>
      }
    >
      <Head>
        <title>ESG Performance NLP Meta-Study</title>
        <meta name="description" content="Pictet Wealth Management x Effixis - ESG Performance NLP Meta-Study" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {props.children}
    </AppShell>
  )
}
