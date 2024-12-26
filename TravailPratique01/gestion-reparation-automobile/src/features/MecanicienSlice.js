// src/features/mecanicienSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Action asynchrone pour récupérer la liste des mécaniciens depuis l'API
export const fetchMecaniciens = createAsyncThunk(
  'mecaniciens/fetchMecaniciens',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/users/mecaniciens/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data; // la liste de mécanos
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur lors du fetch des mécaniciens');
    }
  }
);

const mecanicienSlice = createSlice({
  name: 'mecaniciens',
  initialState: {
    mecaniciens: [],  // Liste dynamique
    loading: false,
    error: null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMecaniciens.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMecaniciens.fulfilled, (state, action) => {
        state.loading = false;
        state.mecaniciens = action.payload; // on stocke la liste reçue
      })
      .addCase(fetchMecaniciens.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Impossible de récupérer la liste des mécaniciens.";
      });
  },
});

export const { setLoading, setError } = mecanicienSlice.actions;

export default mecanicienSlice.reducer;
