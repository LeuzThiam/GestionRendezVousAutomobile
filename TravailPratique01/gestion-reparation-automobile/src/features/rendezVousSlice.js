// src/features/rendezVousSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  rendezVous: [],
  // On retire cette liste :
  // mecaniciens: [
  //   { ... },
  //   { ... },
  // ],
};

const rendezVousSlice = createSlice({
  name: 'rendezVous',
  initialState,
  reducers: {
    addRendezVous: (state, action) => {
      const newRendezVous = {
        ...action.payload,
        status: 'en attente',
        id: new Date().getTime(),
      };
      state.rendezVous.push(newRendezVous);
      console.log('Nouveau rendez-vous (Redux) :', newRendezVous);
    },
    // ... le reste de vos reducers (confirmRendezVous, updateRendezVous, etc.)
    confirmRendezVous: (state, action) => {
      const id = action.payload;
      const rdv = state.rendezVous.find((r) => r.id === id);
      if (rdv) rdv.status = 'confirmé';
    },
    updateRendezVous: (state, action) => {
      const { id, estimatedTime, quote, status } = action.payload;
      const rdv = state.rendezVous.find((r) => r.id === id);
      if (rdv) {
        if (estimatedTime !== undefined) rdv.estimatedTime = estimatedTime;
        if (quote !== undefined) rdv.quote = quote;
        if (status !== undefined) rdv.status = status;
      }
    },
    // etc...
  },
});

export const {
  addRendezVous,
  confirmRendezVous,
  updateRendezVous,
  // ...
} = rendezVousSlice.actions;

export default rendezVousSlice.reducer;
