// src/store.js (ou src/app/store.js)

import { configureStore } from '@reduxjs/toolkit';

import userSlice from './features/userSlice';
import rendezVousSlice from './features/rendezVousSlice';
import vehicleSlice from './features/vehiculeSlice';
import mecanicienSlice from './features/MecanicienSlice';

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
    vehicles: vehicleSlice,
    mecaniciens: mecanicienSlice,
  },
  preloadedState: {
    user: {
      user: userFromStorage,
      isAuthenticated: !!userFromStorage,
      loading: false,
      error: null,
    },
  },
});

export default store;
