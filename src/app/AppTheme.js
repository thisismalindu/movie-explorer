import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useSelector } from 'react-redux';

const themes = {
  light: createTheme({ palette: { mode: 'light' } }),
  dark: createTheme({ palette: { mode: 'dark' } }),
};

export default function AppTheme({ children }) {
  const mode = useSelector((state) => state.profile?.data.theme === 'dark' ? 'dark' : 'light');
  return (
    <ThemeProvider theme={themes[mode]}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
