import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { store } from './state/store';
import './index.css'
import App from './App.tsx'
import '@mantine/core/styles.css';
import { theme } from './theme.ts';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Provider store={store}>
        <Notifications />
        <App />
      </Provider>
    </MantineProvider>
  </StrictMode>,
);