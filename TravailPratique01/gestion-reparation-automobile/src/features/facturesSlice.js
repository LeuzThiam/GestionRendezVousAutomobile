// src/features/facturesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk asynchrone pour récupérer les factures depuis l’API
export const fetchFactures = createAsyncThunk(
  'factures/fetchFactures',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/factures/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // si besoin d'un token
        },
      });
      return res.data; // Le tableau de factures renvoyé par l'API
    } catch (err) {
      return rejectWithValue("Impossible de récupérer les factures.");
    }
  }
);

const initialState = {
  factures: [], // Liste des factures
  loading: false,
  error: null,
};

const facturesSlice = createSlice({
  name: 'factures',
  initialState,
  reducers: {
    // Ex: ajouter une facture "manuellement" après un paiement
    addFacture: (state, action) => {
      state.factures.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Lorsque la requête démarre
      .addCase(fetchFactures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Lorsque la requête réussit
      .addCase(fetchFactures.fulfilled, (state, action) => {
        state.loading = false;
        state.factures = action.payload; // on stocke la liste
      })
      // Lorsque la requête échoue
      .addCase(fetchFactures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // ex: "Impossible de récupérer les factures."
      });
  },
});

export const { addFacture } = facturesSlice.actions;
export default facturesSlice.reducer;
