// src/features/mecanicienSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Action asynchrone pour récupérer la liste des mécaniciens depuis l'API
export const fetchMecaniciens = createAsyncThunk(
  'mecaniciens/fetchMecaniciens',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/users/mecaniciens/`, {
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

export const createMecanicien = createAsyncThunk(
  'mecaniciens/createMecanicien',
  async (payload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/users/owner/mecaniciens/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur lors de la creation du mecanicien');
    }
  }
);

export const deleteMecanicien = createAsyncThunk(
  'mecaniciens/deleteMecanicien',
  async (mecanicienId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/users/owner/mecaniciens/${mecanicienId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return mecanicienId;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Erreur lors de la suppression du mecanicien');
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
      })
      .addCase(createMecanicien.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMecanicien.fulfilled, (state, action) => {
        state.loading = false;
        state.mecaniciens.unshift(action.payload);
      })
      .addCase(createMecanicien.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Impossible de creer le mecanicien.';
      })
      .addCase(deleteMecanicien.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMecanicien.fulfilled, (state, action) => {
        state.loading = false;
        state.mecaniciens = state.mecaniciens.filter(
          (mecanicien) => mecanicien.id !== action.payload
        );
      })
      .addCase(deleteMecanicien.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Impossible de supprimer le mecanicien.';
      });
  },
});

export const { setLoading, setError } = mecanicienSlice.actions;

export default mecanicienSlice.reducer;
