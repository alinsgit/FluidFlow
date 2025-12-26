import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider } from './contexts/AppContext';
import { UIProvider } from './contexts/UIContext';
import { StatusBarProvider } from './contexts/StatusBarContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DEFAULT_FILES } from './constants/defaultFiles';
import './style.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Application error:', error, errorInfo);
        // Here you could send the error to a service like Sentry
      }}
    >
      <ThemeProvider>
        <UIProvider>
          <StatusBarProvider>
            <AppProvider defaultFiles={DEFAULT_FILES}>
              <App />
            </AppProvider>
          </StatusBarProvider>
        </UIProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);