// src/features/vehicleSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  vehicles: [], // Liste des véhicules
  loading: false,
  error: null,
};

// -- Thunk pour récupérer la liste des véhicules
export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/vehicules/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // si JWT nécessaire
        },
      });
      return response.data; // le tableau de véhicules
    } catch (error) {
      return rejectWithValue('Impossible de récupérer la liste de véhicules.');
    }
  }
);

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    // Remplace toute la liste
    setVehicles: (state, action) => {
      state.vehicles = action.payload;
    },
    // Ajouter un véhicule
    addVehicle: (state, action) => {
      state.vehicles.push(action.payload);
    },
    // Supprimer un véhicule
    removeVehicle: (state, action) => {
      state.vehicles = state.vehicles.filter(
        (vehicle) => vehicle.id !== action.payload
      );
    },
    // Mettre à jour un véhicule existant
    updateVehicle: (state, action) => {
      const updated = action.payload;
      const index = state.vehicles.findIndex((v) => v.id === updated.id);
      if (index !== -1) {
        state.vehicles[index] = updated;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload; // on met la liste reçue
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // ex : "Impossible de récupérer la liste..."
      });
  },
});

export const {
  setVehicles,
  addVehicle,
  removeVehicle,
  updateVehicle,
} = vehicleSlice.actions;

export default vehicleSlice.reducer;
