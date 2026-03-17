// src/features/userSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCurrentGarageRequest } from '../shared/api/garageApi';
import { fetchUserProfileRequest, updateUserProfileRequest } from '../shared/api/userApi';

const persistedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
})();

// --- Thunk #1 : Récupérer l'utilisateur depuis l’API
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchUserProfileRequest();
    } catch (err) {
      return rejectWithValue(
        err.response?.data || 'Impossible de récupérer les informations utilisateur.'
      );
    }
  }
);

export const fetchCurrentGarage = createAsyncThunk(
  'user/fetchCurrentGarage',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchCurrentGarageRequest();
    } catch (err) {
      return rejectWithValue(
        err.response?.data || 'Impossible de récupérer les informations du garage.'
      );
    }
  }
);

// --- Thunk #2 : Mettre à jour l'utilisateur dans l’API
export const updateUserAsync = createAsyncThunk(
  'user/updateUser',
  async (updatedData, { rejectWithValue }) => {
    try {
      return await updateUserProfileRequest(updatedData);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || 'Impossible de mettre à jour votre profil.'
      );
    }
  }
);

const initialState = {
  user: persistedUser,
  isAuthenticated: !!persistedUser,
  currentGarage: null,
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
      state.error = null;
    },
    // Logout local
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.currentGarage = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
    },
    // Mise à jour locale (sans API)
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
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
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(action.payload));
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
      })
      .addCase(fetchCurrentGarage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentGarage.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGarage = action.payload;
      })
      .addCase(fetchCurrentGarage.rejected, (state, action) => {
        state.loading = false;
        state.currentGarage = null;
        state.error = action.payload;
      });
  },
});

export const { login, logout, updateUser } = userSlice.actions;
export default userSlice.reducer;
