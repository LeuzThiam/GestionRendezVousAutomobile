import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import AppProviders from './app/AppProviders';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <AppProviders>
    <App />
  </AppProviders>
);
