import React from 'react';
import ReactDOM from 'react-dom/client'; // Utilisation correcte avec React 18
import App from './App';
import { AuthProvider } from './shared/auth/AuthContext';

// Créer une root avec React 18
const root = ReactDOM.createRoot(document.getElementById('root'));

// Utiliser root.render pour monter l'application
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
