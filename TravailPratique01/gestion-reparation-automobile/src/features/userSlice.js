// src/features/userSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// --- Thunk #1 : Récupérer l'utilisateur depuis l’API
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/profile/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // si JWT nécessaire
        },
      });
      return response.data; // user renvoyé par l’API
    } catch (err) {
      return rejectWithValue(
        err.response?.data || 'Impossible de récupérer les informations utilisateur.'
      );
    }
  }
);

// --- Thunk #2 : Mettre à jour l'utilisateur dans l’API
export const updateUserAsync = createAsyncThunk(
  'user/updateUser',
  async (updatedData, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/users/profile/update/`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data; // user mis à jour
    } catch (err) {
      return rejectWithValue(
        err.response?.data || 'Impossible de mettre à jour votre profil.'
      );
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  paymentInfo: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Login local
    login: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    // Logout local
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
    },
    // Mise à jour locale (sans API)
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    // Infos de paiement (sans API)
    updatePaymentInfo: (state, action) => {
      state.paymentInfo = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchUser
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        // On considère qu’on est connecté
        state.isAuthenticated = true;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // updateUserAsync
    builder
      .addCase(updateUserAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // user mis à jour depuis l'API
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(updateUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { login, logout, updateUser, updatePaymentInfo } = userSlice.actions;
export default userSlice.reducer;
