import React from 'react';
import ReactDOM from 'react-dom/client'; // Utilisation correcte avec React 18
import { Provider } from 'react-redux';
import App from './App';
import store from './store'; // Import du store

// Créer une root avec React 18
const root = ReactDOM.createRoot(document.getElementById('root'));

// Utiliser root.render pour monter l'application
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
