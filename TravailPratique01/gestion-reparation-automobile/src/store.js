// src/store.js (ou src/app/store.js)

import { configureStore } from '@reduxjs/toolkit';

import userSlice from './features/userSlice';
import rendezVousSlice from './features/rendezVousSlice';
import facturesSlice from './features/facturesSlice';

// Importez le nouveau vehicleSlice
import vehicleSlice from './features/vehiculeSlice';

// Importez aussi mecanicienSlice si nécessaire
import mecanicienSlice from './features/mecanicienSlice';

let userFromStorage = null;

try {
  userFromStorage = JSON.parse(localStorage.getItem('user')) || null;
} catch {
  userFromStorage = null;
}

const store = configureStore({
  reducer: {
    user: userSlice,
    rendezVous: rendezVousSlice,
    factures: facturesSlice,

    // Le state "vehicles" pointera vers vehicleSlice.reducer
    vehicles: vehicleSlice,

    mecaniciens: mecanicienSlice,
  },
  preloadedState: {
    user: {
      user: userFromStorage,
      isAuthenticated: !!userFromStorage,
      paymentInfo: null,
      loading: false,
      error: null,
    },
  },
});

export default store;
