
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Update imports to point to the correct files within the src directory.
import App from './src/App';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { UserDataProvider } from './src/contexts/UserDataContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <UserDataProvider>
        <App />
      </UserDataProvider>
    </LanguageProvider>
  </React.StrictMode>
);