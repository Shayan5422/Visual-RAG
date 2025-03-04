import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Extend the theme to include custom colors, fonts, etc
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e0f0ff',
      100: '#b9d9ff',
      200: '#90c2ff',
      300: '#67abff',
      400: '#3e94ff',
      500: '#147df9',
      600: '#0062d9',
      700: '#0047a5',
      800: '#002e70',
      900: '#00173b',
    },
  },
  fonts: {
    body: "'Roboto', sans-serif",
    heading: "'Roboto', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      }
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
); 