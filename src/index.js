import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { store } from './app/store';
import ProfileSessionProvider from './features/profiles/ProfileSessionProvider';

const theme = createTheme();
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
        <ProfileSessionProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ProfileSessionProvider>
      </Provider>
    </ThemeProvider>
  </React.StrictMode>
);
